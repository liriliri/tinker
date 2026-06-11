import type { GitCommitDetail, GitCommitSummary } from '../../types/git'
import { exec, requireRepo } from './core'

const COMMIT_LOG_FORMAT = '%H%n%h%n%an%n%ae%n%at%n%s'

function isShaLike(query: string): boolean {
  return /^[0-9a-f]{4,40}$/i.test(query)
}

function matchesAuthor(author: string, filter: string): boolean {
  return author.toLowerCase().includes(filter.toLowerCase())
}

function parseCommitLogRecords(stdout: string): GitCommitSummary[] {
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

async function searchCommitsBySha(
  currentPath: string,
  refName: string,
  query: string,
  author?: string
): Promise<{ commits: GitCommitSummary[]; hasMore: boolean } | null> {
  const { exitCode, stdout: shaOut } = await exec(
    ['rev-parse', '--verify', '--quiet', `${query}^{commit}`],
    currentPath
  )
  if (exitCode !== 0) return null

  const sha = shaOut.trim()
  const { exitCode: onBranch } = await exec(
    ['merge-base', '--is-ancestor', sha, refName],
    currentPath
  )
  if (onBranch !== 0) {
    return { commits: [], hasMore: false }
  }

  const { stdout } = await exec(
    [
      'log',
      '-z',
      `--format=${COMMIT_LOG_FORMAT}`,
      '--use-mailmap',
      '-1',
      '--no-walk',
      sha,
    ],
    currentPath
  )

  let commits = parseCommitLogRecords(stdout)
  if (author) {
    commits = commits.filter((commit) => matchesAuthor(commit.author, author))
  }

  return {
    commits,
    hasMore: false,
  }
}

function parseShortlogAuthors(stdout: string): string[] {
  if (!stdout.trim()) return []

  return stdout
    .trim()
    .split('\n')
    .map((line) => {
      const tab = line.indexOf('\t')
      if (tab !== -1) return line.slice(tab + 1).trim()
      return line.replace(/^\s*\d+\s+/, '').trim()
    })
    .filter(Boolean)
}

async function getCommitsInternal(
  refName: string,
  limit: number,
  skip: number
): Promise<GitCommitSummary[]> {
  const currentPath = requireRepo()

  const { stdout } = await exec(
    [
      'log',
      '-z',
      `--format=${COMMIT_LOG_FORMAT}`,
      '--use-mailmap',
      refName,
      `--max-count=${limit}`,
      `--skip=${skip}`,
    ],
    currentPath
  )

  return parseCommitLogRecords(stdout)
}

export async function getCommits(
  refName: string,
  limit = 100,
  skip = 0
): Promise<GitCommitSummary[]> {
  return getCommitsInternal(refName, limit, skip)
}

export async function searchCommits(
  refName: string,
  query: string,
  skip = 0,
  limit = 50,
  author?: string
): Promise<{ commits: GitCommitSummary[]; hasMore: boolean }> {
  const currentPath = requireRepo()
  const trimmedQuery = query.trim()
  const trimmedAuthor = author?.trim() || ''

  if (!trimmedQuery && !trimmedAuthor) {
    return { commits: [], hasMore: false }
  }

  if (trimmedQuery && isShaLike(trimmedQuery)) {
    const shaResult = await searchCommitsBySha(
      currentPath,
      refName,
      trimmedQuery,
      trimmedAuthor
    )
    if (shaResult) {
      return shaResult
    }
  }

  const fetchLimit = limit + 1
  const args = [
    'log',
    '-z',
    `--format=${COMMIT_LOG_FORMAT}`,
    '--use-mailmap',
    `--skip=${skip}`,
    `-n${fetchLimit}`,
  ]

  if (trimmedAuthor) {
    args.push(`--author=${trimmedAuthor}`, '-i')
  }

  if (trimmedQuery) {
    args.push(`--grep=${trimmedQuery}`, '-i', '--extended-regexp')
  }

  args.push(refName)

  const { stdout } = await exec(args, currentPath)
  const all = parseCommitLogRecords(stdout)
  const hasMore = all.length > limit

  return {
    commits: hasMore ? all.slice(0, limit) : all,
    hasMore,
  }
}

export async function getAuthors(refName: string): Promise<string[]> {
  const currentPath = requireRepo()

  const { stdout, exitCode } = await exec(
    ['shortlog', '-s', '-n', refName],
    currentPath
  )
  if (exitCode === 0) {
    const authors = parseShortlogAuthors(stdout)
    if (authors.length > 0) return authors
  }

  const { stdout: logOut, exitCode: logExitCode } = await exec(
    ['log', '--format=%aN', refName],
    currentPath
  )
  if (logExitCode !== 0 || !logOut.trim()) return []

  const seen = new Set<string>()
  return logOut
    .trim()
    .split('\n')
    .filter((name) => name && !seen.has(name) && seen.add(name))
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
