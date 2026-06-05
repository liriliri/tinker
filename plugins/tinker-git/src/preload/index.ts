import { contextBridge } from 'electron'
import { exec } from 'dugite'
import type {
  GitBlameHunk,
  GitBranch,
  GitCommitDetail,
  GitCommitSummary,
  GitRefKind,
  OpenRepositoryResult,
} from '../common/types'

let repoPath = ''

function requireRepo(): string {
  if (!repoPath) {
    throw new Error('No repository open')
  }
  return repoPath
}

function formatRefName(fullName: string): {
  name: string
  kind: GitRefKind
  isRemote: boolean
} {
  if (fullName.startsWith('refs/heads/')) {
    return {
      name: fullName.slice('refs/heads/'.length),
      kind: 'local',
      isRemote: false,
    }
  }
  if (fullName.startsWith('refs/remotes/')) {
    return {
      name: fullName.slice('refs/remotes/'.length),
      kind: 'remote',
      isRemote: true,
    }
  }
  if (fullName.startsWith('refs/tags/')) {
    return {
      name: fullName.slice('refs/tags/'.length),
      kind: 'tag',
      isRemote: false,
    }
  }
  return { name: fullName, kind: 'local', isRemote: false }
}

const gitObj = {
  getRepoPath(): string {
    return repoPath
  },

  async openRepository(path: string): Promise<OpenRepositoryResult> {
    if (repoPath === path) {
      const { stdout } = await exec(['rev-parse', '--abbrev-ref', 'HEAD'], path)
      return { repoPath, headRef: stdout.trim() }
    }

    const { exitCode } = await exec(['rev-parse', '--git-dir'], path)
    if (exitCode !== 0) {
      throw new Error(`Not a git repository: ${path}`)
    }

    repoPath = path

    const { stdout } = await exec(['rev-parse', '--abbrev-ref', 'HEAD'], path)
    return { repoPath, headRef: stdout.trim() }
  },

  async getBranches(): Promise<GitBranch[]> {
    const currentPath = requireRepo()

    const { stdout: headOut } = await exec(
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      currentPath
    )
    const headName = `refs/heads/${headOut.trim()}`

    const { stdout } = await exec(
      [
        'for-each-ref',
        '--format=%(refname)%00%(objectname:short=8)%00%(*objectname:short=8)',
        'refs/heads/',
        'refs/remotes/',
        'refs/tags/',
      ],
      currentPath
    )

    const branches: GitBranch[] = []
    const seen = new Set<string>()

    for (const line of stdout.trim().split('\n')) {
      if (!line) continue

      const [fullName, objSha, peeledSha] = line.split('\0')

      if (/^refs\/remotes\/[^/]+\/HEAD$/.test(fullName)) {
        continue
      }

      if (seen.has(fullName)) {
        continue
      }
      seen.add(fullName)

      const sha = peeledSha || objSha
      const { name, kind, isRemote } = formatRefName(fullName)

      branches.push({
        name,
        fullName,
        kind,
        isRemote,
        isHead: fullName === headName,
        sha,
      })
    }

    return branches.sort((a, b) => {
      if (a.isHead !== b.isHead) {
        return a.isHead ? -1 : 1
      }
      const kindOrder: Record<GitRefKind, number> = {
        local: 0,
        remote: 1,
        tag: 2,
      }
      if (a.kind !== b.kind) {
        return kindOrder[a.kind] - kindOrder[b.kind]
      }
      return a.name.localeCompare(b.name)
    })
  },

  async getCommits(
    refName: string,
    limit = 100,
    skip = 0
  ): Promise<GitCommitSummary[]> {
    const currentPath = requireRepo()

    const { stdout } = await exec(
      [
        'log',
        '-z',
        `--format=%H%n%h%n%an%n%ae%n%at%n%s`,
        refName,
        `--max-count=${limit}`,
        `--skip=${skip}`,
      ],
      currentPath
    )

    const records = stdout.split('\0').filter(Boolean)
    if (records.length === 0) return []

    return records.map((record) => {
      const [sha, , author, email, dateStr, summary] = record.split('\n')
      return {
        sha,
        shortSha: sha.slice(0, 8),
        summary,
        author,
        email,
        date: parseInt(dateStr, 10) * 1000,
      }
    })
  },

  async getCommitDetail(sha: string): Promise<GitCommitDetail> {
    const currentPath = requireRepo()

    const { stdout: metaOut } = await exec(
      ['show', '--no-patch', '-z', `--format=%H%n%h%n%an%n%ae%n%at%n%s`, sha],
      currentPath
    )

    const metaClean = metaOut.replace(/\0$/, '')
    const [fullSha, , author, email, dateStr, summary] = metaClean.split('\n')

    const { stdout: msgOut } = await exec(
      ['log', '-1', '--format=%B', sha],
      currentPath
    )
    const message = msgOut.replace(/\n$/, '')
    const body = message.split('\n').slice(1).join('\n').trim()

    let diff = ''
    try {
      const { stdout: diffOut } = await exec(
        ['show', '--format=', '-m', '-p', sha],
        currentPath
      )
      diff = diffOut.trimEnd()
    } catch {
      // show may fail for edge cases, return empty diff
    }

    return {
      sha: fullSha,
      shortSha: fullSha.slice(0, 7),
      summary,
      body,
      message,
      author,
      email,
      date: parseInt(dateStr, 10) * 1000,
      diff,
    }
  },

  async getCommitTree(
    sha: string,
    dirPath = ''
  ): Promise<Array<{ name: string; path: string; isDirectory: boolean }>> {
    const currentPath = requireRepo()

    const target = dirPath ? `${sha}:${dirPath}` : sha
    const { stdout } = await exec(
      ['ls-tree', '--full-tree', target],
      currentPath
    )

    const output = stdout.trim()
    if (!output) return []

    const result: Array<{
      name: string
      path: string
      isDirectory: boolean
    }> = []

    for (const line of output.split('\n')) {
      if (!line) continue
      const tabIdx = line.lastIndexOf('\t')
      if (tabIdx === -1) continue

      const info = line.slice(0, tabIdx)
      const name = line.slice(tabIdx + 1)
      const parts = info.split(' ')
      const type = parts[1] // 'tree' or 'blob'

      result.push({
        name,
        path: dirPath ? `${dirPath}/${name}` : name,
        isDirectory: type === 'tree',
      })
    }

    result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return result
  },

  async getCommitFileContent(sha: string, filePath: string): Promise<string> {
    const currentPath = requireRepo()
    const { stdout } = await exec(['show', `${sha}:${filePath}`], currentPath)
    return stdout.replace(/\n$/, '')
  },

  async getCommitFileBlame(
    sha: string,
    filePath: string
  ): Promise<GitBlameHunk[]> {
    const currentPath = requireRepo()
    const { stdout } = await exec(
      ['blame', '--porcelain', sha, '--', filePath],
      currentPath
    )

    const hunks: GitBlameHunk[] = []
    const lines = stdout.split('\n')

    let i = 0
    while (i < lines.length) {
      const header = lines[i]
      if (!header || header.startsWith('\t')) {
        i++
        continue
      }

      const headerParts = header.split(' ')
      if (headerParts.length < 4) {
        i++
        continue
      }

      const hunkSha = headerParts[0]
      // final-line is headerParts[2], line-count is headerParts[3]
      const startLine = parseInt(headerParts[2], 10)
      const lineCount = parseInt(headerParts[3], 10)
      let authorName = ''
      let authorTime = 0
      let summary = ''

      i++
      // Read metadata lines (no tab prefix)
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

      const date = new Date(authorTime * 1000)
      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(
        date.getHours()
      ).padStart(2, '0')}:${String(date.getMinutes()).padStart(
        2,
        '0'
      )}:${String(date.getSeconds()).padStart(2, '0')}`

      hunks.push({
        sha: hunkSha,
        author: authorName,
        message: summary,
        date: dateStr,
        startLineNumber: startLine,
        lineCount,
      })

      // Skip content lines (tab-prefixed) for this hunk
      while (i < lines.length && lines[i] && lines[i].startsWith('\t')) {
        i++
      }
    }

    return hunks
  },
}

contextBridge.exposeInMainWorld('git', gitObj)

declare global {
  const git: typeof gitObj
}
