import { IpcCaptureScreen, IpcGetCaptureSources } from 'common/types'
import { clipboard, desktopCapturer } from 'electron'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import startWith from 'licia/startWith'
import { exec, resolveResources } from 'share/main/lib/util'
import { imageDataUrl, loadMod } from '../util'
import { execFile } from 'child_process'

const THUMBNAIL_SIZE = { width: 320, height: 320 }

type NodeMacPermissions = {
  getAuthStatus: (type: string) => string
  askForScreenCaptureAccess: (openPreferences?: boolean) => void
}

let nodeMacPermissions: NodeMacPermissions | null = null

async function ensureScreenCaptureAccess() {
  if (!isMac) return

  if (!nodeMacPermissions) {
    nodeMacPermissions = await loadMod('node-mac-permissions')
  }
  if (!nodeMacPermissions) return

  const status = nodeMacPermissions.getAuthStatus('screen')
  if (status === 'authorized') return

  nodeMacPermissions.askForScreenCaptureAccess(status !== 'not determined')
}

export const captureScreen: IpcCaptureScreen = async () => {
  if (isMac) {
    await exec('screencapture -i -r -c')
    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      return image.toDataURL()
    }
  } else if (isWindows) {
    const exePath = resolveResources('ScreenCapture.exe')
    return new Promise((resolve) => {
      const screenCapture = execFile(exePath)
      screenCapture.on('exit', (code) => {
        if (code) {
          const image = clipboard.readImage()
          if (!image.isEmpty()) {
            return resolve(image.toDataURL())
          }
        }

        resolve('')
      })
    })
  }

  return ''
}

export const getCaptureSources: IpcGetCaptureSources = async (options = {}) => {
  await ensureScreenCaptureAccess()

  const sources = await desktopCapturer.getSources({
    types: options.types ?? ['screen', 'window'],
    thumbnailSize: THUMBNAIL_SIZE,
    fetchWindowIcons: true,
  })

  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    type: startWith(source.id, 'screen:') ? 'screen' : 'window',
    thumbnail: imageDataUrl(source.thumbnail),
    appIcon: imageDataUrl(source.appIcon),
  }))
}
