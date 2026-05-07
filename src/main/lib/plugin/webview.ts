import { IpcSendDebuggerCommand, IpcShowDevTools } from 'common/types'
import { webContents } from 'electron'
import { handleEvent } from 'share/main/lib/util'

const showDevTools: IpcShowDevTools = async function (
  srcWebContentsId,
  devtoolsWebContentsId
) {
  const src = webContents.fromId(srcWebContentsId)
  const devtools = webContents.fromId(devtoolsWebContentsId)
  if (src && devtools) {
    src.setDevToolsWebContents(devtools)
    src.openDevTools()
    devtools.executeJavaScript('window.location.reload()')
  }
}

const sendDebuggerCommand: IpcSendDebuggerCommand = async function (
  webContentsId,
  method,
  params?
) {
  const wc = webContents.fromId(webContentsId)
  if (!wc) throw new Error('WebContents not found')
  if (!wc.debugger.isAttached()) {
    wc.debugger.attach('1.3')
    wc.once('destroyed', () => {
      try {
        wc.debugger.detach()
      } catch {
        // already detached
      }
    })
  }
  const result = await wc.debugger.sendCommand(method, params)
  return result
}

export function init() {
  handleEvent('showDevTools', showDevTools)
  handleEvent('sendDebuggerCommand', sendDebuggerCommand)
}
