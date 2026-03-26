import type { SearchResult } from '../../common/types'

export async function search(
  query: string,
  lang: string
): Promise<SearchResult[]> {
  return aiChat.search(query, lang)
}

export function formatResults(results: SearchResult[]): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join('\n\n')
}
