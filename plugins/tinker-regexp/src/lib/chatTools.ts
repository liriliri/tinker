import type { AgentTool } from 'share/lib/Agent'
import regexpStore from '../store'

export const GET_REGEXP_TOOL = {
  type: 'function',
  function: {
    name: 'get_regexp',
    description:
      'Get the current regular expression pattern, flags, syntax error (if any), and match count against the test text.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

export const SET_REGEXP_TOOL = {
  type: 'function',
  function: {
    name: 'set_regexp',
    description:
      'Update the regular expression pattern and/or flags in the editor. Changes apply immediately and re-run matching against the test text.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The regular expression pattern (without delimiters)',
        },
        flags: {
          type: 'string',
          description:
            'Optional flags: g (global), i (case insensitive), m (multiline), s (dotall), u (unicode), y (sticky)',
        },
      },
      required: ['pattern'],
    },
  },
} as const

export const GET_TEST_TEXT_TOOL = {
  type: 'function',
  function: {
    name: 'get_test_text',
    description:
      'Get the current test text used to evaluate the regular expression.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

export const SET_TEST_TEXT_TOOL = {
  type: 'function',
  function: {
    name: 'set_test_text',
    description:
      'Replace the test text in the editor. Matching is re-run immediately against the current pattern.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The new test text',
        },
      },
      required: ['text'],
    },
  },
} as const

const TOOL_DEFINITIONS = [
  GET_REGEXP_TOOL,
  SET_REGEXP_TOOL,
  GET_TEST_TEXT_TOOL,
  SET_TEST_TEXT_TOOL,
] as const

export type RegexpToolName =
  | 'get_regexp'
  | 'set_regexp'
  | 'get_test_text'
  | 'set_test_text'

const SUPPORTED_TOOL_NAMES = new Set<string>([
  'get_regexp',
  'set_regexp',
  'get_test_text',
  'set_test_text',
])

export function isSupportedToolName(name: string | undefined): boolean {
  return !!name && SUPPORTED_TOOL_NAMES.has(name)
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set_regexp': {
      const pattern = typeof args.pattern === 'string' ? args.pattern : ''
      const flags = typeof args.flags === 'string' ? args.flags : ''
      const summary = flags ? `/${pattern}/${flags}` : pattern
      return summary.length > 60 ? `${summary.slice(0, 60)}…` : summary
    }
    case 'set_test_text': {
      const text = typeof args.text === 'string' ? args.text : ''
      return text.length > 60 ? `${text.slice(0, 60)}…` : text
    }
    default:
      return ''
  }
}

function getRegexpState(): string {
  return JSON.stringify(
    {
      pattern: regexpStore.pattern,
      flags: regexpStore.flags,
      error: regexpStore.error,
      matchCount: regexpStore.matches.length,
    },
    null,
    2
  )
}

function setRegexp(args: Record<string, unknown>): string {
  const pattern = typeof args.pattern === 'string' ? args.pattern : ''
  const flags = typeof args.flags === 'string' ? args.flags : regexpStore.flags

  regexpStore.setPattern(pattern)
  if (typeof args.flags === 'string') {
    regexpStore.setFlags(flags)
  }

  return getRegexpState()
}

export const REGEXP_AGENT_TOOLS: AgentTool[] = TOOL_DEFINITIONS.map(
  (definition) => {
    const name = definition.function.name as RegexpToolName
    return {
      definition,
      execute: (args) => {
        switch (name) {
          case 'get_regexp':
            return getRegexpState()
          case 'set_regexp':
            return setRegexp(args)
          case 'get_test_text':
            return regexpStore.testText
          case 'set_test_text': {
            const text = typeof args.text === 'string' ? args.text : ''
            regexpStore.setTestText(text)
            return `Test text updated (${text.length} characters).`
          }
          default:
            return `Error: Unknown tool "${name}"`
        }
      },
    }
  }
)
