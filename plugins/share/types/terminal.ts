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
