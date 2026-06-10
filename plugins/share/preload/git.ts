import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import mime from 'licia/mime'

function exec(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      { cwd, encoding: 'utf8' as BufferEncoding, maxBuffer: 100 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (!err || typeof err.code === 'number') {
          resolve({
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: typeof err?.code === 'number' ? err.code : 0,
          })
          return
        }
        reject(err)
      }
    )
  })
}

function execRaw(
  args: string[],
  cwd: string,
  options?: { maxBuffer?: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      {
        cwd,
        encoding: null,
        maxBuffer: options?.maxBuffer ?? 100 * 1024 * 1024,
      },
      (err, stdout) => {
        if (!err || typeof err.code === 'number') {
          resolve((stdout || Buffer.alloc(0)) as Buffer)
          return
        }
        reject(err)
      }
    )
  })
}
import type {
  GitBlameHunk,
  GitBranch,
  GitCommitDetail,
  GitCommitSummary,
  GitRefKind,
  OpenRepositoryResult,
  CommitTreeEntry,
} from '../types/git'

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

export function getRepoPath(): string {
  return repoPath
}

export function findGitRepoRoot(filePath: string): string | null {
  let dir = path.dirname(filePath)
  const root = path.parse(dir).root
  while (dir !== root) {
    const gitPath = path.join(dir, '.git')
    try {
      if (fs.existsSync(gitPath)) {
        return dir
      }
    } catch {
      // ignore fs errors
    }
    dir = path.dirname(dir)
  }
  return null
}

export async function openRepository(
  path: string
): Promise<OpenRepositoryResult> {
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
}

export async function getBranches(): Promise<GitBranch[]> {
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
}

export async function getCommits(
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
}

export async function getCommitDetail(sha: string): Promise<GitCommitDetail> {
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
}

export async function getCommitTree(
  sha: string,
  dirPath = ''
): Promise<CommitTreeEntry[]> {
  const currentPath = requireRepo()

  const target = dirPath ? `${sha}:${dirPath}` : sha
  const { stdout } = await exec(['ls-tree', '--full-tree', target], currentPath)

  const output = stdout.trim()
  if (!output) return []

  const result: CommitTreeEntry[] = []

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
}

export async function getCommitFileContent(
  sha: string,
  filePath: string
): Promise<string> {
  const currentPath = requireRepo()
  const { stdout } = await exec(['show', `${sha}:${filePath}`], currentPath)
  return stdout.replace(/\n$/, '')
}

export async function getCommitFileContentBinary(
  sha: string,
  filePath: string
): Promise<string> {
  const currentPath = requireRepo()
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mimeType = (mime(ext) as string) || 'application/octet-stream'
  const buffer = await execRaw(['show', `${sha}:${filePath}`], currentPath)
  const base64 = buffer.toString('base64')
  return `data:${mimeType};base64,${base64}`
}

function formatBlameDate(authorTime: number): string {
  const date = new Date(authorTime * 1000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')} ${String(
    date.getHours()
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(
    date.getSeconds()
  ).padStart(2, '0')}`
}

interface BlameMetaCache {
  author: string
  summary: string
  date: string
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
    // First line of a group: "<sha> <orig> <result> <count>"
    // Repeated lines from same commit: "<sha> <orig> <result>"
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

    let dateStr = ''
    if (authorTime > 0) {
      dateStr = formatBlameDate(authorTime)
      metaCache.set(hunkSha, {
        author: authorName,
        summary,
        date: dateStr,
      })
    } else {
      const cached = metaCache.get(hunkSha)
      if (cached) {
        authorName = cached.author
        summary = cached.summary
        dateStr = cached.date
      }
    }

    const hunk: GitBlameHunk = {
      sha: hunkSha,
      author: authorName,
      message: summary,
      date: dateStr,
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
