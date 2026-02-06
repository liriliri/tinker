import { IpcCaptureScreen } from 'common/types'
import { clipboard } from 'electron'
import isMac from 'licia/isMac'
import { exec } from 'share/main/lib/util'

export const captureScreen: IpcCaptureScreen = async () => {
  if (isMac) {
    await exec('screencapture -i -r -c')
    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      return image.toDataURL()
    }
  }

  return ''
}
