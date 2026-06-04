import { isDiffBlockTooLarge } from './diffLimits'

export type CommitDiffLineType = 'add' | 'delete' | 'context'

export interface CommitDiffLine {
  type: CommitDiffLineType
  /** Line text without the unified-diff origin prefix (+, -, or space). */
  content: string
}

export interface CommitDiffBlock {
  key: string
  oldPath: string
  newPath: string
  title: string
  body: string
  lines: CommitDiffLine[]
  additions: number
  deletions: number
  isBinary: boolean
  isLarge: boolean
}

export function classifyDiffLine(line: string): CommitDiffLine {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return { type: 'add', content: line.slice(1) }
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return { type: 'delete', content: line.slice(1) }
  }
  if (line.startsWith(' ')) {
    return { type: 'context', content: line.slice(1) }
  }
  return { type: 'context', content: line }
}

const DIFF_HEADER_RE = /^diff --git a\/(.+) b\/(.+)$/
const HUNK_HEADER_RE = /^@@ .+ @@/
const METADATA_LINE_RE =
  /^(diff --git |index |--- |\+\+\+ |new file mode |deleted file mode )/

function formatBlockTitle(oldPath: string, newPath: string, content: string) {
  if (
    content.includes('Binary files ') ||
    content.includes('GIT binary patch')
  ) {
    return oldPath === newPath ? oldPath : `${oldPath} → ${newPath}`
  }

  if (oldPath === '/dev/null') {
    return newPath
  }

  if (newPath === '/dev/null') {
    return oldPath
  }

  return oldPath === newPath ? oldPath : `${oldPath} → ${newPath}`
}

export function parseCommitDiff(diff: string): CommitDiffBlock[] {
  if (!diff) return []

  const blocks: CommitDiffBlock[] = []
  let currentLines: string[] = []
  let currentHeader: { oldPath: string; newPath: string } | null = null
  let currentHeaderLine = ''

  const flush = () => {
    if (!currentHeader || currentLines.length === 0) return
    const body = currentLines.join('\n')
    const { oldPath, newPath } = currentHeader
    let additions = 0
    let deletions = 0

    for (const line of currentLines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions += 1
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions += 1
      }
    }

    blocks.push({
      key: `${oldPath}::${newPath}::${blocks.length}`,
      oldPath,
      newPath,
      title: formatBlockTitle(oldPath, newPath, body || currentHeaderLine),
      body,
      lines: currentLines.map(classifyDiffLine),
      additions,
      deletions,
      isBinary:
        body.includes('Binary files ') || body.includes('GIT binary patch'),
      isLarge: isDiffBlockTooLarge(body, currentLines),
    })
  }

  for (const line of diff.split('\n')) {
    const headerMatch = DIFF_HEADER_RE.exec(line)
    if (headerMatch) {
      flush()
      currentHeader = {
        oldPath: headerMatch[1],
        newPath: headerMatch[2],
      }
      currentHeaderLine = line
      currentLines = []
      continue
    }

    if (!currentHeader) {
      continue
    }

    if (METADATA_LINE_RE.test(line)) {
      continue
    }

    if (HUNK_HEADER_RE.test(line)) {
      continue
    }

    currentLines.push(line)
  }

  flush()
  return blocks
}
