import { IpcCaptureScreen } from 'common/types'
import { clipboard } from 'electron'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import { exec, resolveResources } from 'share/main/lib/util'
import { execFile } from 'child_process'

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
