import { IApp, IpcCreatePluginShortcut, IpcGetApps } from 'common/types'
import { app } from 'electron'
import endWith from 'licia/endWith'
import path, { resolve } from 'path'
import { exec, getUserDataPath, sha1 } from 'share/main/lib/util'
import fs from 'fs-extra'
import memoize from 'licia/memoize'
import sleep from 'licia/sleep'
import plist from 'plist'
import log from 'share/common/log'
import startWith from 'licia/startWith'
import os from 'os'
import isEmpty from 'licia/isEmpty'
import trim from 'licia/trim'
import unique from 'licia/unique'
import pkg from '../../../../package.json'
import { isDev } from 'share/common/util'
import { getFileIcon } from '../fileIcon'
import { plugins } from '../plugin/loader'
import { sanitizeShortcutAppName } from '../util'
const logger = log('macApp')

const PLUGIN_SHORTCUT_BUNDLE_ID_PREFIX = `${pkg.appId}.plugin.`

const SHORTCUT_ICON_SIZES: Array<[number, string]> = [
  [128, 'icon_128x128.png'],
  [256, 'icon_128x128@2x.png'],
  [256, 'icon_256x256.png'],
  [512, 'icon_256x256@2x.png'],
]

const DEFAULT_ICNS =
  '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns'

const apps: IApp[] = []

export const getApps: IpcGetApps = async (force = false) => {
  if (!force && !isEmpty(apps)) {
    return apps
  }

  apps.length = 0

  let discoveredApps = await getAppsFromSystemProfiler()

  if (isEmpty(discoveredApps)) {
    logger.info(
      'system_profiler returned no apps, falling back to directory scan'
    )
    discoveredApps = await getAppsFromDirectoryScan()
  }

  apps.push(...unique(discoveredApps, (a, b) => a.path === b.path))
  logger.info('final unique apps count:', apps.length)

  return apps
}

async function getAppsFromSystemProfiler(): Promise<IApp[]> {
  try {
    const command =
      '/usr/sbin/system_profiler -xml -detailLevel mini SPApplicationsDataType'
    const stdout = await exec(command)

    const installedApps: any[] = (plist.parse(stdout) as any)[0]._items || []
    logger.info('system_profiler returned', installedApps.length, 'apps')

    const discoveredApps: IApp[] = []
    for (let i = 0, len = installedApps.length; i < len; i++) {
      const { path, _name } = installedApps[i]

      if (!filterApps(path) || !filterSubApps(path)) {
        continue
      }

      if (await isPluginShortcutApp(path)) {
        continue
      }

      const icon = await extractIcon(path)
      discoveredApps.push({
        name: _name,
        path,
        icon,
      })
    }

    return discoveredApps
  } catch (e) {
    logger.warn('failed to get apps from system_profiler:', e)
    return []
  }
}

async function getAppsFromDirectoryScan(): Promise<IApp[]> {
  const discoveredApps: IApp[] = []

  for (const dirPath of appPaths) {
    if (!(await fs.pathExists(dirPath))) {
      continue
    }

    try {
      const entries = await fs.readdir(dirPath)
      for (const entry of entries) {
        if (!endWith(entry, '.app')) {
          continue
        }

        const appPath = path.join(dirPath, entry)
        if (await isPluginShortcutApp(appPath)) {
          continue
        }

        const name = await getAppNameFromPlist(appPath, entry)
        const icon = await extractIcon(appPath)
        discoveredApps.push({ name, path: appPath, icon })
      }
    } catch (e) {
      logger.warn('failed to scan directory:', dirPath, e)
    }
  }

  logger.info('directory scan discovered', discoveredApps.length, 'apps')
  return discoveredApps
}

async function readInfoPlist(appPath: string): Promise<any> {
  const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist')

  let data = await fs.readFile(infoPlistPath, 'utf8')
  if (startWith(data, 'bplist')) {
    data = await exec(`plutil -convert xml1 -o - "${infoPlistPath}"`)
  }

  return plist.parse(data) as any
}

async function getAppNameFromPlist(
  appPath: string,
  fallbackName: string
): Promise<string> {
  const defaultName = fallbackName.replace(/\.app$/, '')

  try {
    const parsed = await readInfoPlist(appPath)

    return (
      trim(parsed.CFBundleDisplayName || '') ||
      trim(parsed.CFBundleName || '') ||
      defaultName
    )
  } catch {
    return defaultName
  }
}

async function extractIcon(appPath: string) {
  const iconPath = getIconPath(appPath)

  if (!(await fs.pathExists(iconPath))) {
    await generateIcon(appPath)
  }

  return iconPath
}

async function generateIcon(appPath: string) {
  const iconPath = getIconPath(appPath)
  try {
    const buffer = await getFileIcon(appPath)
    if (!buffer) {
      throw new Error('File not found')
    }
    await fs.writeFile(iconPath, buffer)
  } catch {
    const icnsPath = await getIcnsPath(appPath)
    await sleep(50)
    await exec(
      `sips -s format png "${icnsPath}" -o "${iconPath}" --resampleHeightWidth 128 128`
    )
  }
}

const getIconPath = memoize(function (appPath: string) {
  const cacheKey = sha1(appPath)
  return getUserDataPath(`data/cache/icons/${cacheKey}.png`)
})

async function getIcnsPath(appPath: string) {
  try {
    const parsed = await readInfoPlist(appPath)
    const iconFile = trim(parsed.CFBundleIconFile || '')

    if (!iconFile) {
      return DEFAULT_ICNS
    }

    let icnsPath = path.join(appPath, 'Contents', 'Resources', iconFile)

    if (!endWith(icnsPath, '.icns')) {
      icnsPath += '.icns'
    }

    if (!(await fs.pathExists(icnsPath))) {
      return DEFAULT_ICNS
    }

    return icnsPath
  } catch {
    return DEFAULT_ICNS
  }
}

const appPaths = [
  '/Applications',
  '/System/Applications',
  `${os.homedir()}/Applications`,
]

function filterApps(path: string) {
  if (!endWith(path, '.app')) {
    return false
  }

  for (let i = 0, len = appPaths.length; i < len; i++) {
    if (startWith(path, appPaths[i])) {
      return true
    }
  }

  return false
}

function filterSubApps(path: string) {
  const parts = path.split('.app')
  return parts.length === 2 && parts[1] === ''
}

async function isPluginShortcutApp(appPath: string) {
  if (!startWith(appPath, `${os.homedir()}/Applications`)) {
    return false
  }

  try {
    const parsed = await readInfoPlist(appPath)
    const bundleId = trim(parsed.CFBundleIdentifier || '')
    return isPluginShortcutBundleId(bundleId)
  } catch {
    return false
  }
}

function isPluginShortcutBundleId(bundleId: string) {
  return startWith(bundleId, PLUGIN_SHORTCUT_BUNDLE_ID_PREFIX)
}

function getPluginShortcutBundleId(pluginId: string) {
  const sanitized = pluginId.replace(/[^a-zA-Z0-9.-]/g, '-')
  return `${PLUGIN_SHORTCUT_BUNDLE_ID_PREFIX}${sanitized}`
}

function getTinkerAppPath() {
  const contentsIndex = process.execPath.indexOf('.app/Contents/')
  if (contentsIndex === -1) {
    throw new Error('TINKER app path not found')
  }

  return process.execPath.substring(0, contentsIndex + 4)
}

function getLaunchTargets() {
  if (isDev()) {
    return {
      electron: process.execPath,
      cli: resolve(app.getAppPath(), 'cli.js'),
    }
  }

  const appPath = getTinkerAppPath()
  return {
    electron: path.join(appPath, 'Contents/MacOS', pkg.productName),
    cli: path.join(appPath, 'Contents/Resources/app.asar/main/cli.js'),
  }
}

function buildLaunchScript(pluginId: string, electron: string, cli: string) {
  return `#!/bin/bash
export ELECTRON_RUN_AS_NODE=1
exec "${electron}" "${cli}" open "${pluginId}"
`
}

async function createShortcutIcns(iconPath: string, destIcnsPath: string) {
  if (endWith(iconPath, '.icns')) {
    await fs.writeFile(destIcnsPath, await fs.readFile(iconPath))
    return
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tinker-icon-'))
  const iconsetDir = path.join(tmpDir, 'AppIcon.iconset')
  const sourceIcon = path.join(tmpDir, 'source.png')

  try {
    await fs.mkdir(iconsetDir)
    await fs.writeFile(sourceIcon, await fs.readFile(iconPath))

    for (const [size, filename] of SHORTCUT_ICON_SIZES) {
      const output = path.join(iconsetDir, filename)
      await exec(`sips -z ${size} ${size} "${sourceIcon}" --out "${output}"`)
    }
    await exec(`iconutil -c icns "${iconsetDir}" -o "${destIcnsPath}"`)
  } finally {
    await fs.remove(tmpDir)
  }
}

export const createPluginShortcut: IpcCreatePluginShortcut = async function (
  id
) {
  const plugin = plugins[id]
  if (!plugin) {
    throw new Error(`Plugin not found: ${id}`)
  }

  const { electron, cli } = getLaunchTargets()

  if (!(await fs.pathExists(electron))) {
    throw new Error(`Electron binary not found: ${electron}`)
  }
  if (!(await fs.pathExists(cli))) {
    throw new Error(`CLI script not found: ${cli}`)
  }

  const appName = sanitizeShortcutAppName(plugin.name)
  const appPath = path.join(os.homedir(), 'Applications', `${appName}.app`)
  const contentsPath = path.join(appPath, 'Contents')
  const macosPath = path.join(contentsPath, 'MacOS')
  const resourcesPath = path.join(contentsPath, 'Resources')
  const launchPath = path.join(macosPath, 'launch')
  const icnsPath = path.join(resourcesPath, 'AppIcon.icns')

  await fs.remove(appPath)
  await fs.mkdirp(macosPath)
  await fs.mkdirp(resourcesPath)

  await createShortcutIcns(plugin.icon, icnsPath)

  const infoPlist = plist.build({
    CFBundleDisplayName: plugin.name,
    CFBundleName: plugin.name,
    CFBundleExecutable: 'launch',
    CFBundleIconFile: 'AppIcon',
    CFBundleIdentifier: getPluginShortcutBundleId(plugin.id),
    CFBundlePackageType: 'APPL',
    CFBundleVersion: '1.0',
  })
  await fs.writeFile(path.join(contentsPath, 'Info.plist'), infoPlist)

  const launchScript = buildLaunchScript(plugin.id, electron, cli)
  await fs.writeFile(launchPath, launchScript, { mode: 0o755 })

  return appPath
}
