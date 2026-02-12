import { IApp, IpcGetApps } from 'common/types'
import trim from 'licia/trim'
import memoize from 'licia/memoize'
import fs from 'fs-extra'
import path from 'path'
import isWindows from 'licia/isWindows'
import unique from 'licia/unique'
import lowerCase from 'licia/lowerCase'
import { getUserDataPath, sha1 } from 'share/main/lib/util'
import { loadMod } from '../util'
import { getFileIcon } from '../fileIcon'

type RegistryModule = typeof import('registry-js')
type RegistryValueEntry = import('registry-js').RegistryValue
type RegistryHiveValue = import('registry-js').HKEY
type RegistryHive = 'HKEY_LOCAL_MACHINE' | 'HKEY_CURRENT_USER'

type RegistrySource = {
  hive: RegistryHive
  path: string
}

const REGISTRY_SOURCES: RegistrySource[] = [
  {
    hive: 'HKEY_LOCAL_MACHINE',
    path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  },
  {
    hive: 'HKEY_LOCAL_MACHINE',
    path: 'SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  },
  {
    hive: 'HKEY_CURRENT_USER',
    path: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  },
  {
    hive: 'HKEY_CURRENT_USER',
    path: 'SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
  },
]

const EXECUTABLE_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.lnk']
const BLOCKED_EXECUTABLE_KEYWORDS = [
  'uninstall',
  '\\programdata\\package cache\\',
  '\\windows\\system32\\msiexec.exe',
]
const ICON_SIZE: 16 | 32 | 64 | 256 = 64

const envMap = new Map<string, string>()
Object.keys(process.env).forEach((key) => {
  const value = process.env[key]
  if (typeof value === 'string') {
    envMap.set(key.toUpperCase(), value)
  }
})

const apps: IApp[] = []
let registryModule: RegistryModule | null = null

if (isWindows) {
  loadMod('registry-js').then((mod) => {
    if (mod) {
      registryModule = mod as RegistryModule
    }
  })
}

export const getApps: IpcGetApps = async (force = false) => {
  if (!isWindows) {
    return []
  }

  const registry = registryModule
  if (!registry) {
    return []
  }

  if (!force && apps.length) {
    return apps
  }

  const discovered: IApp[] = []
  for (let i = 0, len = REGISTRY_SOURCES.length; i < len; i++) {
    const list = await readRegistryApps(registry, REGISTRY_SOURCES[i])
    discovered.push(...list)
  }

  const deduped = dedupeApps(discovered)
  apps.length = 0
  apps.push(...deduped)
  return apps
}

async function readRegistryApps(
  registry: RegistryModule,
  source: RegistrySource
): Promise<IApp[]> {
  const hive = registry.HKEY[source.hive] as RegistryHiveValue | undefined
  if (!hive) {
    return []
  }

  const subKeys = registry.enumerateKeysSafe(hive, source.path)
  if (!subKeys.length) {
    return []
  }

  const appList: IApp[] = []
  const appPromises: Promise<void>[] = []
  for (let i = 0, len = subKeys.length; i < len; i++) {
    const subKey = subKeys[i]
    appPromises.push(
      getAppFromKey(registry, hive, `${source.path}\\${subKey}`).then((app) => {
        if (app) {
          appList.push(app)
        }
      })
    )
  }
  await Promise.all(appPromises)
  return appList
}

async function getAppFromKey(
  registry: RegistryModule,
  hive: RegistryHiveValue,
  key: string
): Promise<IApp | null> {
  const values = registry.enumerateValuesSafe(hive, key)
  if (!values.length) {
    return null
  }

  const data = buildValueMap(values)

  if (shouldSkipEntry(data)) {
    return null
  }

  const name = trim(getStringValue(data, 'DisplayName'))
  if (!name) {
    return null
  }

  const executable = resolveExecutable(data)
  if (!executable || !(await fs.pathExists(executable))) {
    return null
  }

  const iconPath = await extractAppIcon(executable)
  if (!iconPath) {
    return null
  }

  return {
    name,
    icon: iconPath,
    path: executable,
  }
}

type RegistryValueMap = Map<string, string | number>

function buildValueMap(
  values: ReadonlyArray<RegistryValueEntry>
): RegistryValueMap {
  const map: RegistryValueMap = new Map()
  for (const value of values) {
    if (!value || typeof value.name !== 'string') {
      continue
    }
    map.set(value.name, value.data)
  }
  return map
}

function getStringValue(map: RegistryValueMap, key: string): string {
  const value = map.get(key)
  return typeof value === 'string' ? value : ''
}

function getNumberValue(map: RegistryValueMap, key: string) {
  const value = map.get(key)
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed)) {
      return parsed
    }
  }
  return null
}

function shouldSkipEntry(map: RegistryValueMap) {
  if (getNumberValue(map, 'SystemComponent') === 1) {
    return true
  }

  if (getNumberValue(map, 'NoDisplay') === 1) {
    return true
  }

  if (getNumberValue(map, 'WindowsInstaller') === 1) {
    const icon = getStringValue(map, 'DisplayIcon')
    if (!icon) {
      return true
    }
  }

  const releaseType = lowerCase(trim(getStringValue(map, 'ReleaseType')))
  if (releaseType.includes('update') || releaseType.includes('hotfix')) {
    return true
  }

  return false
}

async function extractAppIcon(executablePath: string) {
  if (!executablePath) {
    return ''
  }

  if (!(await fs.pathExists(executablePath))) {
    return ''
  }

  const iconPath = getIconPath(executablePath)
  if (await fs.pathExists(iconPath)) {
    return iconPath
  }

  return generateAppIcon(executablePath, iconPath)
}

async function generateAppIcon(executablePath: string, iconPath: string) {
  try {
    const buffer = await getFileIcon(executablePath, ICON_SIZE)
    if (!buffer) {
      return ''
    }
    await fs.ensureDir(path.dirname(iconPath))
    await fs.writeFile(iconPath, buffer)
    return iconPath
  } catch {
    return ''
  }
}

const getIconPath = memoize(function (executablePath: string) {
  const cacheKey = sha1(executablePath)
  return getUserDataPath(`data/cache/icons/${cacheKey}.png`)
})

function resolveExecutable(map: RegistryValueMap) {
  const candidates = [
    extractExecutablePath(getStringValue(map, 'DisplayIcon'), {
      stripIconIndex: true,
    }),
    extractExecutablePath(getStringValue(map, 'InstallLocation')),
    extractExecutablePath(getStringValue(map, 'ShortcutPath')),
  ]

  for (const candidate of candidates) {
    if (candidate && !shouldSkipExecutable(candidate)) {
      return candidate
    }
  }

  return ''
}

function extractExecutablePath(
  rawValue: string,
  options: { stripIconIndex?: boolean } = {}
): string {
  let value = trim(rawValue)
  if (!value) {
    return ''
  }

  value = expandEnvVariables(value)

  if (options.stripIconIndex) {
    const commaIndex = value.indexOf(',')
    if (commaIndex !== -1) {
      value = value.slice(0, commaIndex)
    }
  }

  const lowerValue = lowerCase(value)
  let matchEnd = -1
  for (let i = 0; i < EXECUTABLE_EXTENSIONS.length; i++) {
    const ext = EXECUTABLE_EXTENSIONS[i]
    const idx = lowerValue.indexOf(ext)
    if (idx !== -1) {
      const candidateEnd = idx + ext.length
      if (matchEnd === -1 || candidateEnd < matchEnd) {
        matchEnd = candidateEnd
      }
    }
  }

  if (matchEnd === -1) {
    return ''
  }

  const executable = normalizePath(value.slice(0, matchEnd))
  return executable
}

function normalizePath(path: string) {
  let cleaned = trim(path.replace(/^@/, ''))
  cleaned = cleaned.replace(/^"+/, '')
  cleaned = cleaned.replace(/^'+/, '')
  return trim(cleaned)
}

function shouldSkipExecutable(value: string) {
  if (!value) {
    return true
  }
  const lower = lowerCase(value)

  for (let i = 0; i < BLOCKED_EXECUTABLE_KEYWORDS.length; i++) {
    if (lower.includes(BLOCKED_EXECUTABLE_KEYWORDS[i])) {
      return true
    }
  }

  return false
}

function expandEnvVariables(value: string) {
  return value.replace(/%([^%]+)%/g, (_, name: string) => {
    const replacement = envMap.get(name.toUpperCase())
    return typeof replacement === 'string' ? replacement : ''
  })
}

function dedupeApps(list: IApp[]) {
  const normalized = list
    .map((app) => ({
      ...app,
      name: trim(app.name),
      path: trim(app.path),
    }))
    .filter((app) => app.path)

  const deduped = unique(
    normalized,
    (a, b) => lowerCase(a.path) === lowerCase(b.path)
  )
  return deduped
}
