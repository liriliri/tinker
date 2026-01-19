import { IApp, IpcGetApps } from 'common/types'
import path from 'path'
import fs from 'fs-extra'
import log from 'share/common/log'
import os from 'os'
import isEmpty from 'licia/isEmpty'
import ini from 'licia/ini'
import unique from 'licia/unique'
import lowerCase from 'licia/lowerCase'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import { glob } from 'glob'
import { getUserDataPath, resolveResources, sha1 } from 'share/main/lib/util'
import memoize from 'licia/memoize'
import contain from 'licia/contain'
import splitPath from 'licia/splitPath'

const logger = log('linuxApp')

const DEFAULT_ICON = resolveResources('linux-app.png')

const APP_PATHS = [
  '/usr/share/applications',
  '/var/lib/snapd/desktop/applications',
  `${os.homedir()}/.local/share/applications`,
]

const ICON_THEMES: string[] = []

const ICON_SIZES = [
  '24x24',
  '48x48',
  'scalable',
  '128x128',
  '256x256',
  '512x512',
  '24',
  '48',
  '128',
  '256',
  '512',
]
const ICON_TYPES = [
  'apps',
  'categories',
  'devices',
  'mimetypes',
  'legacy',
  'actions',
  'places',
  'status',
  'mimes',
]
const ICON_EXTENSIONS = ['.png', '.svg']

function isIconValid(filePath: string): boolean {
  const ext = lowerCase(splitPath(filePath).ext)
  return contain(ICON_EXTENSIONS, ext)
}

const iconCache: Map<string, string> = new Map()
let iconCacheInitialized = false

async function initIconCache() {
  if (iconCacheInitialized) {
    return
  }

  const themes = await fs.readdir(path.join('/usr/share/icons'))
  ICON_THEMES.push(...themes)

  try {
    const iconDirs = [
      '/usr/share/pixmaps',
      path.join(os.homedir(), '.local/share/icons'),
    ]

    for (const dir of iconDirs) {
      if (!(await fs.pathExists(dir))) {
        continue
      }

      const pattern = path.join(dir, `**/*.{png,svg}`)
      const files = await glob(pattern, { nodir: true })

      for (const file of files) {
        const basename = path.basename(file, path.extname(file))
        if (
          !iconCache.has(basename) ||
          file.includes('/hicolor/') ||
          file.includes('/apps/')
        ) {
          iconCache.set(basename, file)
        }
      }
    }

    iconCacheInitialized = true
  } catch (e) {
    logger.warn('Failed to initialize icon cache:', e)
  }
}

let apps: IApp[] = []

export const getApps: IpcGetApps = async (force = false) => {
  if (!force && !isEmpty(apps)) {
    return apps
  }

  await initIconCache()

  const desktopFileList: string[] = []

  for (let i = 0, len = APP_PATHS.length; i < len; i++) {
    const appPath = APP_PATHS[i]
    if (!(await fs.pathExists(appPath))) {
      continue
    }

    const pattern = path.join(appPath, '*.desktop')
    const files = await glob(pattern, { nodir: true })
    desktopFileList.push(...files)
  }

  const appList: IApp[] = []
  for (let i = 0, len = desktopFileList.length; i < len; i++) {
    const app = await parseDesktopFile(desktopFileList[i])
    if (app) {
      appList.push(app)
    }
  }

  apps = unique(appList, (a, b) => a.path === b.path)
  return apps
}

async function parseDesktopFile(filePath: string): Promise<IApp | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8')

    if (!contain(content, '[Desktop Entry]')) {
      return null
    }

    const parsed = ini.parse(content)
    const appInfo = parsed['Desktop Entry'] as Record<string, string>

    if (
      !appInfo ||
      appInfo.Type !== 'Application' ||
      !appInfo.Exec ||
      appInfo.Terminal === 'true' ||
      appInfo.NoDisplay === 'true' ||
      appInfo.OnlyShowIn
    ) {
      return null
    }

    const icon = await extractIcon(appInfo.Icon || '', filePath)
    if (!icon) {
      return null
    }

    const name = appInfo.Name || path.basename(filePath)

    const execPath = trim(
      appInfo.Exec.replace(/ %[A-Za-z]/g, '').replace(/"/g, '')
    )

    return {
      name,
      path: execPath,
      icon,
    }
  } catch (e) {
    logger.warn(`Failed to parse desktop file ${filePath}:`, e)
    return null
  }
}

async function resolveIconPath(
  iconName: string,
  desktopFilePath: string
): Promise<string> {
  if (!iconName) {
    return ''
  }

  if (startWith(iconName, '/')) {
    if ((await fs.pathExists(iconName)) && isIconValid(iconName)) {
      return iconName
    }
    return ''
  }

  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!
  }

  if (
    startWith(desktopFilePath, '/usr/share/applications') ||
    startWith(desktopFilePath, '/var/lib/snapd/desktop/applications')
  ) {
    const iconPath = await searchIconInThemes(iconName)
    if (iconPath) {
      return iconPath
    }
  }

  return ''
}

async function extractIcon(iconName: string, desktopFilePath: string) {
  const iconPath = getIconPath(desktopFilePath)

  let hasIcon = false
  let p = ''
  for (let i = 0, len = ICON_EXTENSIONS.length; i < len; i++) {
    p = iconPath + ICON_EXTENSIONS[i]
    if (await fs.pathExists(p)) {
      hasIcon = true
      break
    }
  }
  if (!hasIcon) {
    p = await generateIcon(iconName, desktopFilePath)
  }

  return p
}

async function generateIcon(iconName: string, desktopFilePath: string) {
  const iconPath = getIconPath(desktopFilePath)
  let sourcePath = await resolveIconPath(iconName, desktopFilePath)
  if (!sourcePath) {
    sourcePath = DEFAULT_ICON
  }
  const ext = splitPath(sourcePath).ext
  const p = iconPath + ext
  await fs.copyFile(sourcePath, p)
  return p
}

const getIconPath = memoize(function (desktopFilePath: string) {
  const cacheKey = sha1(desktopFilePath)
  return getUserDataPath(`data/cache/icons/${cacheKey}`)
})

async function searchIconInThemes(iconName: string): Promise<string | null> {
  for (const theme of ICON_THEMES) {
    for (const size of ICON_SIZES) {
      for (const type of ICON_TYPES) {
        for (const ext of ICON_EXTENSIONS) {
          const result = await checkIconExists(
            theme,
            type,
            size,
            iconName + ext
          )
          if (result) {
            return result
          }
        }

        const result = await checkIconExists(theme, type, size, iconName)
        if (result) {
          return result
        }
      }
    }
  }

  return null
}

async function checkIconExists(
  theme: string,
  type: string,
  size: string,
  iconPath: string
): Promise<string> {
  const paths = [
    path.join('/usr/share/icons', theme, type, size, iconPath),
    path.join('/usr/share/icons', theme, size, type, iconPath),
  ]

  for (let i = 0, len = paths.length; i < len; i++) {
    if (await fs.pathExists(paths[i])) {
      return paths[i]
    }
  }

  return ''
}
