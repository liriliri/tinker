import {
  buildSegments,
  type TextSearchFileGroup,
  type TextSearchSegment,
} from '../../lib/textSearch'

export const TEXT_SEARCH_ROW_HEIGHT = 22

export type TextSearchRow =
  | {
      type: 'header'
      key: string
      group: TextSearchFileGroup
      collapsed: boolean
    }
  | {
      type: 'match'
      key: string
      matchKey: string
      filePath: string
      result: tinker.SearchTextResult
      segments: TextSearchSegment[]
    }

export function buildTextSearchRows(
  groups: TextSearchFileGroup[],
  collapsed: Record<string, boolean>
): TextSearchRow[] {
  const rows: TextSearchRow[] = []

  for (const group of groups) {
    const isCollapsed = collapsed[group.path] === true
    rows.push({
      type: 'header',
      key: `h:${group.path}`,
      group,
      collapsed: isCollapsed,
    })

    if (!isCollapsed) {
      for (let idx = 0; idx < group.matches.length; idx++) {
        const match = group.matches[idx]
        rows.push({
          type: 'match',
          key: `m:${group.path}:${match.lineNumber}:${idx}`,
          matchKey: `${group.path}:${match.lineNumber}`,
          filePath: group.path,
          result: match,
          segments: buildSegments(match.text, match.submatches),
        })
      }
    }
  }

  return rows
}
