import { existsSync } from 'fs'
import { platform } from 'os'

const isWindows = platform() === 'win32'

export interface ShellInfo {
  name: string
  path: string
}

export interface TerminalInfo {
  /** Foreground process name (e.g. "vim", "zsh"). */
  processName: string
  /** Full path of the current working directory. */
  cwd: string
}

/**
 * Common shape for a local PTY session (`tinker.createTerminal`) or any
 * caller-implemented session (e.g. SSH). Used by `share/components/Terminal`
 * to drive xterm.js without caring which underlying transport is used.
 */
export interface TerminalSession {
  write(data: string): void
  resize(cols: number, rows: number): void
  destroy(): void
  onData(cb: (data: string) => void): void
  onClose(cb: () => void): void
  onInput(cb: () => void): void
  getInfo(): Promise<TerminalInfo>
}

export function getDefaultShell(): string {
  return isWindows ? 'powershell.exe' : process.env.SHELL || '/bin/zsh'
}

export function getAvailableShells(): ShellInfo[] {
  const shells: ShellInfo[] = []
  const candidates = isWindows
    ? [
        { name: 'PowerShell', path: 'powershell.exe' },
        { name: 'Command Prompt', path: 'cmd.exe' },
      ]
    : [
        { name: 'zsh', path: '/bin/zsh' },
        { name: 'bash', path: '/bin/bash' },
        { name: 'sh', path: '/bin/sh' },
        { name: 'fish', path: '/usr/local/bin/fish' },
        { name: 'fish', path: '/opt/homebrew/bin/fish' },
      ]

  for (const c of candidates) {
    if (isWindows || existsSync(c.path)) {
      if (!shells.find((s) => s.name === c.name)) {
        shells.push(c)
      }
    }
  }

  return shells
}
