import { execFile } from 'node:child_process'

const EXEC_TIMEOUT_MS = 60_000
const MAX_OUTPUT_CHARS = 10_000

const DENY_PATTERNS = [
  /\brm\s+-[rf]{1,2}\b/i,
  /\bdel\s+\/[fq]\b/i,
  /\brmdir\s+\/s\b/i,
  /(?:^|[;&|]\s*)format\b/i,
  /\b(mkfs|diskpart)\b/i,
  /\bdd\s+if=/i,
  />\s*\/dev\/sd/,
  /\b(shutdown|reboot|poweroff)\b/i,
  /:\(\)\s*\{.*\};\s*:/,
]

function guardCommand(command: string): string | null {
  const lower = command.trim().toLowerCase()
  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(lower)) {
      return 'Error: Command blocked by safety guard (dangerous pattern detected)'
    }
  }

  return null
}

export async function exec(
  command: string,
  workingDir: string,
  timeout?: number
): Promise<string> {
  const guard = guardCommand(command)
  if (guard) return guard

  const effectiveTimeout = Math.min(timeout ?? EXEC_TIMEOUT_MS, 600_000)

  return new Promise((resolve) => {
    const proc = execFile(
      process.platform === 'win32' ? 'cmd' : 'sh',
      process.platform === 'win32' ? ['/c', command] : ['-c', command],
      {
        cwd: workingDir,
        timeout: effectiveTimeout,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        const parts: string[] = []
        if (stdout) parts.push(stdout)
        if (stderr) parts.push(`STDERR:\n${stderr}`)
        if (error?.killed) {
          parts.push(`\nError: Command timed out after ${effectiveTimeout}ms`)
        } else {
          parts.push(`\nExit code: ${error ? error.code ?? 1 : 0}`)
        }

        let result = parts.join('\n') || '(no output)'
        if (result.length > MAX_OUTPUT_CHARS) {
          const half = MAX_OUTPUT_CHARS / 2
          result =
            result.slice(0, half) +
            `\n\n... (${
              result.length - MAX_OUTPUT_CHARS
            } chars truncated) ...\n\n` +
            result.slice(-half)
        }
        resolve(result)
      }
    )
    void proc
  })
}
