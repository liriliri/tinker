import { IpcGetApps, IpcOpenApp } from 'common/types'
import singleton from 'licia/singleton'
import isMac from 'licia/isMac'
import { getApps as getMacApps } from './mac'
import { handleEvent } from 'share/main/lib/util'
import fs from 'fs-extra'
import { getUserDataPath } from 'share/main/lib/util'
import { exec } from 'child_process'

fs.exists(getUserDataPath('data/cache/icons'), function (exists) {
  if (!exists) {
    fs.mkdirp(getUserDataPath('data/cache/icons'))
  }
})

const getApps: IpcGetApps = singleton(async (force = false) => {
  if (isMac) {
    return getMacApps(force)
  }

  return []
})

const openApp: IpcOpenApp = async (path) => {
  if (isMac) {
    exec(`open "${path}"`)
  }
}

export function init() {
  handleEvent('getApps', getApps)
  handleEvent('openApp', openApp)
}
