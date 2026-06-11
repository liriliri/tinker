import { existsSync } from 'fs'
import { platform } from 'os'
import type { ShellInfo } from '../types/terminal'

const isWindows = platform() === 'win32'

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
