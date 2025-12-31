import { IApp, IpcGetApps } from 'common/types'
import endWith from 'licia/endWith'
import path from 'path'
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

const logger = log('macApp')

const DEFAULT_ICNS =
  '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns'

const apps: IApp[] = []

export const getApps: IpcGetApps = async (force = false) => {
  if (!force && !isEmpty(apps)) {
    return apps
  }

  apps.length = 0

  try {
    const command =
      '/usr/sbin/system_profiler -xml -detailLevel mini SPApplicationsDataType'
    const stdout = await exec(command)

    const installedApps: any[] = (plist.parse(stdout) as any)[0]._items

    for (let i = 0, len = installedApps.length; i < len; i++) {
      const { path, _name } = installedApps[i]

      if (!filterApps(path) || !filterSubApps(path)) {
        continue
      }

      apps.push({
        name: _name,
        path,
        icon: await extractIcon(path),
      })
    }
  } catch (e) {
    logger.warn('failed to get apps:', e)
  }

  return apps
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
  const icnsPath = await getIcnsPath(appPath)

  await sleep(50)
  await exec(
    `sips -s format png "${icnsPath}" -o "${iconPath}" --resampleHeightWidth 128 128`
  )
}

const getIconPath = memoize(function (appPath: string) {
  const cacheKey = sha1(appPath)
  return getUserDataPath(`data/cache/icons/${cacheKey}.png`)
})

const RegCFBundleIconFile =
  /<key>CFBundleIconFile<\/key>\s*<string>([^<]+)<\/string>/
async function getIcnsPath(appPath: string) {
  const infoPlistFilePath = path.join(appPath, 'Contents', 'Info.plist')

  let data = await fs.readFile(infoPlistFilePath, 'utf8')
  if (startWith(data, 'bplist')) {
    data = await exec(`plutil -convert xml1 -o - "${infoPlistFilePath}"`)
  }

  const match = data.match(RegCFBundleIconFile)
  const iconFile = match ? trim(match[1]) : ''
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
