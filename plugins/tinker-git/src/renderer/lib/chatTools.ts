import type { AgentTool } from 'share/lib/Agent'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import { EXEC_TOOL } from 'share/tools/shell'

const TOOL_DEFINITIONS = [EXEC_TOOL] as const

const SUPPORTED_TOOL_NAMES = ['exec'] as const

const { getVisibleToolMessages } =
  createToolMessageHelpers(SUPPORTED_TOOL_NAMES)

export { getVisibleToolMessages }

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  if (name === 'exec') {
    const command = typeof args.command === 'string' ? args.command : ''
    return command.length > 60 ? `${command.slice(0, 60)}…` : command
  }
  return ''
}

export function createGitAgentTools(getRepoPath: () => string): AgentTool[] {
  return TOOL_DEFINITIONS.map((definition) => ({
    definition,
    execute: async (args) => {
      const repoPath = getRepoPath()
      if (!repoPath) {
        return 'Error: No repository is open. Ask the user to open a repository first.'
      }

      const command = typeof args.command === 'string' ? args.command : ''
      const timeout =
        typeof args.timeout === 'number' ? args.timeout : undefined
      return git.exec(command, repoPath, timeout)
    },
  }))
}
