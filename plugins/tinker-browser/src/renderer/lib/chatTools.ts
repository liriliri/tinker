import type { AgentTool } from 'share/lib/Agent'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import { getPageContext } from './pageContext'

const MAX_TEXT_LENGTH = 30000

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_page_info',
      description:
        'Get the current page title, URL, and whether the page is still loading.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_text',
      description:
        'Get the visible text content of the current web page. Content may be truncated for very long pages.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_selection',
      description:
        'Get the text currently selected by the user on the web page, if any.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_metadata',
      description:
        'Get page metadata such as meta description, keywords, and Open Graph tags.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
] as const

const SUPPORTED_TOOL_NAMES = TOOL_DEFINITIONS.map(
  (definition) => definition.function.name
)

const { getVisibleToolMessages } =
  createToolMessageHelpers(SUPPORTED_TOOL_NAMES)

export { getVisibleToolMessages }

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  void name
  void args
  return ''
}

function isToolError(
  result: string | Record<string, unknown>
): result is string {
  return typeof result === 'string' && result.startsWith('Error:')
}

function asString(result: string | Record<string, unknown>): string {
  return typeof result === 'string' ? result : String(result ?? '')
}

async function runInPage(
  tabId: string,
  script: string
): Promise<string | Record<string, unknown>> {
  const context = getPageContext(tabId)
  if (!context) {
    return 'Error: Tab is not available.'
  }

  if (!context.url) {
    return 'Error: No web page is open in this tab.'
  }

  const webview = context.getWebview()
  if (!webview) {
    return 'Error: Web page is not loaded yet.'
  }

  try {
    return await webview.executeJavaScript(script, true)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `Error: Failed to read page content. ${message}`
  }
}

async function getPageInfo(tabId: string): Promise<string> {
  const context = getPageContext(tabId)
  if (!context) {
    return 'Error: Tab is not available.'
  }

  if (!context.url) {
    return 'Error: No web page is open in this tab.'
  }

  const result = await runInPage(
    tabId,
    `(() => JSON.stringify({
      title: document.title || '',
      url: location.href || '',
    }))()`
  )

  if (isToolError(result)) {
    return result
  }

  let liveTitle = context.title
  let liveUrl = context.url
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result) as { title?: string; url?: string }
      if (parsed.title) liveTitle = parsed.title
      if (parsed.url) liveUrl = parsed.url
    } catch {
      // Fall back to tab state when live page data is unavailable.
    }
  }

  return JSON.stringify(
    {
      title: liveTitle,
      url: liveUrl,
      isLoading: context.isLoading,
    },
    null,
    2
  )
}

async function getPageText(tabId: string): Promise<string> {
  const result = await runInPage(
    tabId,
    `(() => {
      const text = document.body?.innerText?.replace(/\\s+/g, ' ').trim() || '';
      return text;
    })()`
  )

  if (isToolError(result)) {
    return result
  }

  const text = asString(result)
  if (!text) {
    return 'The page has no visible text content.'
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return `${text.slice(0, MAX_TEXT_LENGTH)}\n\n[Truncated: ${
      text.length - MAX_TEXT_LENGTH
    } more characters omitted]`
  }

  return text
}

async function getPageSelection(tabId: string): Promise<string> {
  const result = await runInPage(
    tabId,
    `(() => {
      const selection = window.getSelection?.()?.toString()?.trim() || '';
      return selection;
    })()`
  )

  if (isToolError(result)) {
    return result
  }

  const selection = asString(result)
  if (!selection) {
    return 'No text is selected on the page.'
  }

  return selection
}

async function getPageMetadata(tabId: string): Promise<string> {
  const result = await runInPage(
    tabId,
    `(() => {
      const meta = {};
      document.querySelectorAll('meta[name], meta[property]').forEach((el) => {
        const key = el.getAttribute('name') || el.getAttribute('property');
        const content = el.getAttribute('content');
        if (key && content) meta[key] = content;
      });
      return JSON.stringify(meta, null, 2);
    })()`
  )

  if (isToolError(result)) {
    return result
  }

  const metadata = typeof result === 'string' ? result : JSON.stringify(result)
  if (!metadata || metadata === '{}') {
    return 'No page metadata was found.'
  }

  return metadata
}

export function createBrowserAgentTools(tabId: string): AgentTool[] {
  return TOOL_DEFINITIONS.map((definition) => {
    const name = definition.function.name
    return {
      definition,
      execute: () => {
        switch (name) {
          case 'get_page_info':
            return getPageInfo(tabId)
          case 'get_page_text':
            return getPageText(tabId)
          case 'get_page_selection':
            return getPageSelection(tabId)
          case 'get_page_metadata':
            return getPageMetadata(tabId)
        }
      },
    }
  })
}
