import type { AgentTool } from 'share/lib/Agent'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import jsonEditorStore from '../store'

const GET_JSON_TOOL = {
  type: 'function',
  function: {
    name: 'get_json',
    description:
      'Get the current JSON content in the editor, validation error (if any), editor mode, and line count.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

const SET_JSON_TOOL = {
  type: 'function',
  function: {
    name: 'set_json',
    description:
      'Replace the JSON content in the editor. Changes apply immediately. The content may be valid or invalid JSON.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The new JSON content',
        },
      },
      required: ['content'],
    },
  },
} as const

const FORMAT_JSON_TOOL = {
  type: 'function',
  function: {
    name: 'format_json',
    description:
      'Pretty-print the current JSON with 2-space indentation. Fails if the content is not valid JSON.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

const MINIFY_JSON_TOOL = {
  type: 'function',
  function: {
    name: 'minify_json',
    description:
      'Minify the current JSON by removing whitespace. Fails if the content is not valid JSON.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

const TOOL_DEFINITIONS = [
  GET_JSON_TOOL,
  SET_JSON_TOOL,
  FORMAT_JSON_TOOL,
  MINIFY_JSON_TOOL,
] as const

type JsonToolName = 'get_json' | 'set_json' | 'format_json' | 'minify_json'

const SUPPORTED_TOOL_NAMES = [
  'get_json',
  'set_json',
  'format_json',
  'minify_json',
] as const

const { isSupportedToolName, getVisibleToolMessages } =
  createToolMessageHelpers(SUPPORTED_TOOL_NAMES)

export { isSupportedToolName, getVisibleToolMessages }

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set_json': {
      const content = typeof args.content === 'string' ? args.content : ''
      return content.length > 60 ? `${content.slice(0, 60)}…` : content
    }
    default:
      return ''
  }
}

function getJsonState(): string {
  return JSON.stringify(
    {
      content: jsonEditorStore.jsonInput,
      error: jsonEditorStore.jsonError,
      mode: jsonEditorStore.mode,
      lineCount: jsonEditorStore.lineCount,
      isEmpty: jsonEditorStore.isEmpty,
      fileName: jsonEditorStore.currentFileName,
    },
    null,
    2
  )
}

function setJson(args: Record<string, unknown>): string {
  const content = typeof args.content === 'string' ? args.content : ''
  jsonEditorStore.setJsonInput(content)
  return getJsonState()
}

function formatJson(): string {
  if (jsonEditorStore.isEmpty) {
    return 'Error: Editor is empty.'
  }

  try {
    jsonEditorStore.formatJson()
    return getJsonState()
  } catch {
    return `Error: ${jsonEditorStore.jsonError || 'Invalid JSON'}`
  }
}

function minifyJson(): string {
  if (jsonEditorStore.isEmpty) {
    return 'Error: Editor is empty.'
  }

  try {
    jsonEditorStore.minifyJson()
    return getJsonState()
  } catch {
    return `Error: ${jsonEditorStore.jsonError || 'Invalid JSON'}`
  }
}

export const JSON_AGENT_TOOLS: AgentTool[] = TOOL_DEFINITIONS.map(
  (definition) => {
    const name = definition.function.name as JsonToolName
    return {
      definition,
      execute: (args) => {
        switch (name) {
          case 'get_json':
            return getJsonState()
          case 'set_json':
            return setJson(args)
          case 'format_json':
            return formatJson()
          case 'minify_json':
            return minifyJson()
          default:
            return `Error: Unknown tool "${name}"`
        }
      },
    }
  }
)
