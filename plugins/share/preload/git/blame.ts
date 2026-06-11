import type { GitBlameHunk } from '../../types/git'
import { exec, requireRepo } from './core'

interface BlameMetaCache {
  author: string
  summary: string
  dateMs: number
}

function parseBlamePorcelain(stdout: string): GitBlameHunk[] {
  const hunks: GitBlameHunk[] = []
  const lines = stdout.split('\n')
  const metaCache = new Map<string, BlameMetaCache>()

  let i = 0
  while (i < lines.length) {
    const header = lines[i]
    if (!header || header.startsWith('\t')) {
      i++
      continue
    }

    const headerParts = header.split(' ')
    if (headerParts.length < 3) {
      i++
      continue
    }

    const hunkSha = headerParts[0]
    const startLine = parseInt(headerParts[2], 10)
    if (Number.isNaN(startLine)) {
      i++
      continue
    }

    let authorName = ''
    let authorTime = 0
    let summary = ''

    i++
    while (i < lines.length && lines[i] && !lines[i].startsWith('\t')) {
      const metaLine = lines[i]
      if (metaLine.startsWith('author ')) {
        authorName = metaLine.slice('author '.length)
      } else if (metaLine.startsWith('author-time ')) {
        authorTime = parseInt(metaLine.slice('author-time '.length), 10)
      } else if (metaLine.startsWith('summary ')) {
        summary = metaLine.slice('summary '.length)
      }
      i++
    }

    let dateMs = 0
    if (authorTime > 0) {
      dateMs = authorTime * 1000
      metaCache.set(hunkSha, {
        author: authorName,
        summary,
        dateMs,
      })
    } else {
      const cached = metaCache.get(hunkSha)
      if (cached) {
        authorName = cached.author
        summary = cached.summary
        dateMs = cached.dateMs
      }
    }

    const hunk: GitBlameHunk = {
      sha: hunkSha,
      author: authorName,
      message: summary,
      dateMs,
      startLineNumber: startLine,
      lineCount: 1,
    }

    const last = hunks[hunks.length - 1]
    if (
      last &&
      last.sha === hunk.sha &&
      last.startLineNumber + last.lineCount === hunk.startLineNumber
    ) {
      last.lineCount++
    } else {
      hunks.push(hunk)
    }

    if (i < lines.length && lines[i]?.startsWith('\t')) {
      i++
    }
  }

  return hunks
}

export async function getCommitFileBlame(
  sha: string,
  filePath: string
): Promise<GitBlameHunk[]> {
  const currentPath = requireRepo()
  const { stdout } = await exec(
    ['blame', '--porcelain', sha, '--', filePath],
    currentPath
  )

  return parseBlamePorcelain(stdout)
}
