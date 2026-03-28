export interface WebSearchResult {
  title: string
  url: string
  content: string
}

export const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      'Search the web for up-to-date information, recent news, or real-time data. Use this when the user asks about current events, facts that may have changed, or anything requiring fresh information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The optimized search query string',
        },
      },
      required: ['query'],
    },
  },
} as const

export function formatWebSearchResults(results: WebSearchResult[]): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join('\n\n')
}
