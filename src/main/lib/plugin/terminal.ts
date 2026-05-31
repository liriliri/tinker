import { exec } from 'child_process'
import { homedir, platform } from 'os'
import { ipcMain, WebContents } from 'electron'
import * as pty from 'node-pty'
import {
  IpcDestroyTerminal,
  IpcGetTerminalInfo,
  IpcResizeTerminal,
  IpcWriteTerminal,
} from 'common/types'
import { handleEvent } from 'share/main/lib/util'
import log from 'share/common/log'

const logger = log('terminal')

const isWindows = platform() === 'win32'
const defaultShell = isWindows
  ? 'powershell.exe'
  : process.env.SHELL || '/bin/zsh'

interface PtySession {
  proc: pty.IPty
  webContents: WebContents
}

const sessions = new Map<string, PtySession>()

function killSession(sessionId: string) {
  const session = sessions.get(sessionId)
  if (!session) return
  logger.debug(`kill session ${sessionId}`)
  try {
    session.proc.kill()
  } catch {
    // ignore
  }
  sessions.delete(sessionId)
}

function killSessionsForWebContents(wc: WebContents) {
  for (const [sessionId, session] of sessions) {
    if (session.webContents === wc) {
      killSession(sessionId)
    }
  }
}

function lsofCwd(pid: number): Promise<string> {
  if (isWindows) return Promise.resolve('')
  return new Promise((resolve) => {
    exec(
      `lsof -p ${pid} -Fn -a -d cwd 2>/dev/null | grep "^n"`,
      { encoding: 'utf8', timeout: 500 },
      (err, stdout) => {
        if (err || !stdout) {
          resolve('')
          return
        }
        resolve(stdout.trim().slice(1))
      }
    )
  })
}

const writeTerminal: IpcWriteTerminal = function (sessionId, data) {
  const session = sessions.get(sessionId)
  if (!session) return
  session.proc.write(data)
}

const resizeTerminal: IpcResizeTerminal = function (sessionId, cols, rows) {
  const session = sessions.get(sessionId)
  if (!session) return
  session.proc.resize(cols, rows)
}

const destroyTerminal: IpcDestroyTerminal = function (sessionId) {
  killSession(sessionId)
}

const getTerminalInfo: IpcGetTerminalInfo = async function (sessionId) {
  const session = sessions.get(sessionId)
  if (!session) return { processName: '', cwd: '' }
  return {
    processName: session.proc.process,
    cwd: await lsofCwd(session.proc.pid),
  }
}

export function init() {
  // createTerminal needs event.sender to know which webContents receives pushed events
  ipcMain.handle(
    'createTerminal',
    (
      event,
      sessionId: string,
      cols: number,
      rows: number,
      cwd?: string,
      shell?: string
    ) => {
      killSession(sessionId)

      const proc = pty.spawn(shell || defaultShell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: cwd || homedir(),
      })

      const webContents = event.sender
      sessions.set(sessionId, { proc, webContents })

      proc.onData((data: string) => {
        if (webContents.isDestroyed()) return
        webContents.send('terminalData', sessionId, data)
      })

      proc.onExit(() => {
        sessions.delete(sessionId)
        if (webContents.isDestroyed()) return
        webContents.send('terminalClose', sessionId)
      })

      webContents.once('destroyed', () => {
        killSessionsForWebContents(webContents)
      })
    }
  )

  handleEvent('writeTerminal', writeTerminal)
  handleEvent('resizeTerminal', resizeTerminal)
  handleEvent('destroyTerminal', destroyTerminal)
  handleEvent('getTerminalInfo', getTerminalInfo)
}
