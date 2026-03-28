export const EXEC_TOOL = {
  type: 'function',
  function: {
    name: 'exec',
    description:
      'Execute a shell command and return its output. Use for running scripts, compiling code, installing packages, git operations, etc.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
        timeout: {
          type: 'integer',
          description:
            'Timeout in milliseconds (default 60000, max 600000). Increase for long-running commands.',
          minimum: 1000,
          maximum: 600000,
        },
      },
      required: ['command'],
    },
  },
} as const

export type ToolName = 'exec'

export function getToolLabel(name: string): string {
  const labels: Record<string, string> = {
    exec: 'Shell',
  }

  return labels[name] ?? name
}
