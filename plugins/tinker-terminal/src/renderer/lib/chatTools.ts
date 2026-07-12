import type { AgentTool } from 'share/lib/Agent'
import {
  getTerminalSession,
  getTerminalSelection,
} from 'share/components/Terminal'
import type { TerminalSession } from 'share/types/terminal'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import type { TabPaneContext } from '../types'
import { getTabPaneContext } from './tabContext'

const GET_TERMINAL_INFO_TOOL = {
  type: 'function',
  function: {
    name: 'get_terminal_info',
    description:
      'Get the active terminal pane context: tab title, pane title, current working directory, and foreground process name.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

const GET_SELECTION_TOOL = {
  type: 'function',
  function: {
    name: 'get_selection',
    description:
      'Get the currently selected text in the active terminal pane, if any.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

const RUN_COMMAND_TOOL = {
  type: 'function',
  function: {
    name: 'run_command',
    description:
      'Run a shell command in the active terminal pane by sending it followed by Enter. Output appears in the terminal.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
      },
      required: ['command'],
    },
  },
} as const

const WRITE_TERMINAL_TOOL = {
  type: 'function',
  function: {
    name: 'write_to_terminal',
    description:
      'Write raw text to the active terminal pane without automatically pressing Enter.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to send to the terminal',
        },
      },
      required: ['text'],
    },
  },
} as const

const TOOL_DEFINITIONS = [
  GET_TERMINAL_INFO_TOOL,
  GET_SELECTION_TOOL,
  RUN_COMMAND_TOOL,
  WRITE_TERMINAL_TOOL,
] as const

type TerminalToolName =
  | 'get_terminal_info'
  | 'get_selection'
  | 'run_command'
  | 'write_to_terminal'

const SUPPORTED_TOOL_NAMES = [
  'get_terminal_info',
  'get_selection',
  'run_command',
  'write_to_terminal',
] as const

const { getVisibleToolMessages } =
  createToolMessageHelpers(SUPPORTED_TOOL_NAMES)

export { getVisibleToolMessages }

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'run_command': {
      return typeof args.command === 'string' ? args.command : ''
    }
    case 'write_to_terminal': {
      return typeof args.text === 'string' ? args.text : ''
    }
    default:
      return ''
  }
}

type ResolvedSession = {
  context: TabPaneContext
  session: TerminalSession
}

function getSession(tabId: string): ResolvedSession | string {
  const context = getTabPaneContext(tabId)
  if (!context) {
    return 'Error: Tab is not available.'
  }

  const session = getTerminalSession(context.paneId)
  if (!session) {
    return 'Error: Terminal pane is not ready.'
  }

  return { context, session }
}

async function getTerminalInfo(tabId: string): Promise<string> {
  const result = getSession(tabId)
  if (typeof result === 'string') return result

  const { context, session } = result
  const info = await session.getInfo()

  return JSON.stringify(
    {
      tabTitle: context.tabTitle,
      paneTitle: context.paneTitle,
      cwd: info.cwd,
      processName: info.processName,
    },
    null,
    2
  )
}

function getSelection(tabId: string): string {
  const result = getSession(tabId)
  if (typeof result === 'string') return result

  const selection = getTerminalSelection(result.context.paneId)
  if (!selection) {
    return 'No text is selected in the terminal.'
  }
  return selection
}

function runCommand(tabId: string, args: Record<string, unknown>): string {
  const result = getSession(tabId)
  if (typeof result === 'string') return result

  const command = typeof args.command === 'string' ? args.command.trim() : ''
  if (!command) {
    return 'Error: Command is empty.'
  }

  result.session.write(`${command}\r`)
  return `Command sent to terminal: ${command}`
}

function writeToTerminal(tabId: string, args: Record<string, unknown>): string {
  const result = getSession(tabId)
  if (typeof result === 'string') return result

  const text = typeof args.text === 'string' ? args.text : ''
  if (!text) {
    return 'Error: Text is empty.'
  }

  result.session.write(text)
  return `Sent ${text.length} characters to terminal.`
}

export function createTerminalAgentTools(tabId: string): AgentTool[] {
  return TOOL_DEFINITIONS.map((definition) => {
    const name = definition.function.name as TerminalToolName
    return {
      definition,
      execute: (args) => {
        switch (name) {
          case 'get_terminal_info':
            return getTerminalInfo(tabId)
          case 'get_selection':
            return getSelection(tabId)
          case 'run_command':
            return runCommand(tabId, args)
          case 'write_to_terminal':
            return writeToTerminal(tabId, args)
          default:
            return `Error: Unknown tool "${name}"`
        }
      },
    }
  })
}
