import path from 'path'
import fs from 'fs'
import { BINARY_EXTS } from '../../lib/fileType'
import type {
  GitCheckoutInfo,
  GitWorkingTreeFile,
  GitWorkingTreeFileDiffContent,
  GitWorkingTreeGroup,
  GitWorkingTreeStatus,
  GitWorkingTreeStatusResult,
} from '../../types/git'
import { exec, requireRepo } from './core'

// ── helpers ──────────────────────────────────────────────────────

function normalizeGitStdout(stdout: string): string {
  return stdout.endsWith('\n') ? stdout.slice(0, -1) : stdout
}

async function readGitShow(spec: string, cwd: string): Promise<string | null> {
  const { exitCode, stdout } = await exec(['show', spec], cwd)
  if (exitCode !== 0) return null
  return normalizeGitStdout(stdout)
}

async function readDiskFile(
  repoPath: string,
  filePath: string
): Promise<string | null> {
  try {
    const content = await fs.promises.readFile(
      path.join(repoPath, filePath),
      'utf8'
    )
    return content
  } catch {
    return null
  }
}

function isBinaryDiffContent(
  filePath: string,
  original: string,
  modified: string
): boolean {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (BINARY_EXTS.has(ext)) return true
  return original.includes('\0') || modified.includes('\0')
}

const MAX_DIFF_CONTENT_BYTES = 70_000_000

function isDiffContentTooLarge(original: string, modified: string): boolean {
  const bytes = new TextEncoder().encode(original).length
  const modifiedBytes = new TextEncoder().encode(modified).length
  return bytes + modifiedBytes > MAX_DIFF_CONTENT_BYTES
}

// ── status parsing ───────────────────────────────────────────────

interface RawFileStatus {
  x: string
  y: string
  path: string
  rename?: string
  isSubmodule?: boolean
}

function parseGitStatusZ(raw: string): RawFileStatus[] {
  const result: RawFileStatus[] = []
  let i = 0

  while (i + 4 < raw.length) {
    const entry: RawFileStatus = {
      x: raw.charAt(i++),
      y: raw.charAt(i++),
      path: '',
    }

    i++

    if (entry.x === 'R' || entry.y === 'R' || entry.x === 'C') {
      const newPathEnd = raw.indexOf('\0', i)
      if (newPathEnd === -1) break
      const oldPathEnd = raw.indexOf('\0', newPathEnd + 1)
      if (oldPathEnd === -1) break
      // git status -z lists renamed entries as NEW\0OLD
      entry.path = raw.substring(i, newPathEnd)
      entry.rename = raw.substring(newPathEnd + 1, oldPathEnd)
      i = oldPathEnd + 1

      if (entry.path.endsWith('/')) {
        entry.path = entry.path.slice(0, -1)
        entry.isSubmodule = true
      }

      result.push(entry)
      continue
    }

    const pathEnd = raw.indexOf('\0', i)
    if (pathEnd === -1) break

    entry.path = raw.substring(i, pathEnd)
    i = pathEnd + 1

    if (entry.path.endsWith('/')) {
      entry.path = entry.path.slice(0, -1)
      entry.isSubmodule = true
    }

    result.push(entry)
  }

  return result
}

function statusLetterFor(status: GitWorkingTreeStatus): string {
  switch (status) {
    case 'index-modified':
    case 'modified':
      return 'M'
    case 'index-added':
    case 'intent-to-add':
      return 'A'
    case 'index-deleted':
    case 'deleted':
      return 'D'
    case 'index-renamed':
    case 'intent-to-rename':
      return 'R'
    case 'index-copied':
      return 'C'
    case 'type-changed':
      return 'T'
    case 'untracked':
      return 'U'
    case 'conflict':
      return '!'
    case 'submodule-dirty':
      return 'S'
    default:
      return '?'
  }
}

function pushWorkingTreeFile(
  files: GitWorkingTreeFile[],
  file: Omit<GitWorkingTreeFile, 'id' | 'statusLetter'>
) {
  files.push({
    ...file,
    statusLetter: statusLetterFor(file.status),
    id: `${file.group}:${file.path}:${file.status}`,
  })
}

function parseGitlinkPaths(stdout: string): Set<string> {
  const paths = new Set<string>()
  for (const line of stdout.split('\n')) {
    if (!line) continue
    const tabIndex = line.indexOf('\t')
    if (tabIndex === -1) continue
    if (line.startsWith('160000 ')) {
      paths.add(line.slice(tabIndex + 1))
    }
  }
  return paths
}

function collectGitlinkCandidates(entries: RawFileStatus[]): string[] {
  const paths = new Set<string>()
  for (const raw of entries) {
    if (raw.isSubmodule) continue
    if (raw.x === 'M' || raw.y === 'M') {
      paths.add(raw.path)
    }
  }
  return [...paths]
}

async function loadGitlinkPaths(
  entries: RawFileStatus[],
  cwd: string
): Promise<Set<string>> {
  const candidates = collectGitlinkCandidates(entries)
  if (candidates.length === 0) return new Set()

  const { exitCode, stdout } = await exec(
    ['ls-files', '-s', '--', ...candidates],
    cwd
  )
  if (exitCode !== 0 || !stdout) return new Set()
  return parseGitlinkPaths(stdout)
}

function pushSubmoduleStatusFiles(
  files: GitWorkingTreeFile[],
  raw: RawFileStatus
) {
  const xy = raw.x + raw.y
  if (xy === ' M') {
    pushWorkingTreeFile(files, {
      path: raw.path,
      status: 'submodule-dirty',
      group: 'changes',
    })
  } else if (xy === 'M ') {
    pushWorkingTreeFile(files, {
      path: raw.path,
      status: 'submodule-dirty',
      group: 'staged',
    })
  } else if (xy === 'MM') {
    pushWorkingTreeFile(files, {
      path: raw.path,
      status: 'submodule-dirty',
      group: 'staged',
    })
    pushWorkingTreeFile(files, {
      path: raw.path,
      status: 'submodule-dirty',
      group: 'changes',
    })
  }
}

function mapStatusEntries(
  entries: RawFileStatus[],
  gitlinkPaths: Set<string>
): GitWorkingTreeFile[] {
  const files: GitWorkingTreeFile[] = []

  for (const raw of entries) {
    if (raw.isSubmodule || gitlinkPaths.has(raw.path)) {
      pushSubmoduleStatusFiles(files, raw)
      continue
    }

    const xy = raw.x + raw.y

    switch (xy) {
      case '??':
        pushWorkingTreeFile(files, {
          path: raw.path,
          status: 'untracked',
          group: 'untracked',
        })
        continue
      case '!!':
        continue
      case 'DD':
      case 'AU':
      case 'UD':
      case 'UA':
      case 'DU':
      case 'AA':
      case 'UU':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'conflict',
          group: 'merge',
        })
        continue
    }

    switch (raw.x) {
      case 'M':
        pushWorkingTreeFile(files, {
          path: raw.path,
          status: 'index-modified',
          group: 'staged',
        })
        break
      case 'A':
        pushWorkingTreeFile(files, {
          path: raw.path,
          status: 'index-added',
          group: 'staged',
        })
        break
      case 'D':
        pushWorkingTreeFile(files, {
          path: raw.path,
          status: 'index-deleted',
          group: 'staged',
        })
        break
      case 'R':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'index-renamed',
          group: 'staged',
        })
        break
      case 'C':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'index-copied',
          group: 'staged',
        })
        break
    }

    switch (raw.y) {
      case 'M':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'modified',
          group: 'changes',
        })
        break
      case 'D':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'deleted',
          group: 'changes',
        })
        break
      case 'A':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'intent-to-add',
          group: 'changes',
        })
        break
      case 'R':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'intent-to-rename',
          group: 'changes',
        })
        break
      case 'T':
        pushWorkingTreeFile(files, {
          path: raw.path,
          renameFrom: raw.rename,
          status: 'type-changed',
          group: 'changes',
        })
        break
    }
  }

  return files
}

// ── checkout info ────────────────────────────────────────────────

export async function getCheckoutInfo(): Promise<GitCheckoutInfo> {
  const currentPath = requireRepo()

  const { stdout: branchOut } = await exec(
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    currentPath
  )
  const branchRef = branchOut.trim()
  const isDetached = branchRef === 'HEAD'

  const { stdout: shaOut } = await exec(['rev-parse', 'HEAD'], currentPath)
  const sha = shaOut.trim()

  const { stdout: shortOut } = await exec(
    ['rev-parse', '--short=8', 'HEAD'],
    currentPath
  )
  const shortSha = shortOut.trim()

  if (isDetached) {
    const { stdout: summaryOut } = await exec(
      ['log', '-1', '--format=%s', 'HEAD'],
      currentPath
    )
    return {
      isDetached: true,
      branchName: null,
      shortSha,
      sha,
      summary: summaryOut.trim() || null,
    }
  }

  return {
    isDetached: false,
    branchName: branchRef,
    shortSha,
    sha,
    summary: null,
  }
}

// ── working tree status ──────────────────────────────────────────

export async function getWorkingTreeStatus(): Promise<GitWorkingTreeStatusResult> {
  const currentPath = requireRepo()

  const [checkout, statusOut] = await Promise.all([
    getCheckoutInfo(),
    exec(['status', '-z', '-uall'], currentPath),
  ])

  const entries = parseGitStatusZ(statusOut.stdout)
  const gitlinkPaths = await loadGitlinkPaths(entries, currentPath)
  const files = mapStatusEntries(entries, gitlinkPaths)

  return { checkout, files }
}

async function getSubmoduleDiffContent(
  filePath: string,
  group: GitWorkingTreeGroup,
  cwd: string
): Promise<{ original: string | null; modified: string | null }> {
  const diffArgs =
    group === 'staged'
      ? ['diff', '--cached', '--', filePath]
      : ['diff', '--', filePath]
  const diffOutput = await exec(diffArgs, cwd)
  if (diffOutput.exitCode === 0 && diffOutput.stdout) {
    return { original: '', modified: normalizeGitStdout(diffOutput.stdout) }
  }
  return { original: null, modified: null }
}

// ── diff content ─────────────────────────────────────────────────

export async function getWorkingTreeFileDiffContent(
  filePath: string,
  group: GitWorkingTreeGroup,
  status: GitWorkingTreeStatus,
  renameFrom?: string
): Promise<GitWorkingTreeFileDiffContent> {
  const currentPath = requireRepo()
  let original: string | null = null
  let modified: string | null = null

  if (status === 'submodule-dirty') {
    const submoduleDiff = await getSubmoduleDiffContent(
      filePath,
      group,
      currentPath
    )
    original = submoduleDiff.original
    modified = submoduleDiff.modified
  } else {
    switch (group) {
      case 'staged':
        if (status === 'index-added') {
          original = ''
          modified = await readGitShow(`:${filePath}`, currentPath)
        } else if (status === 'index-deleted') {
          original = await readGitShow(`HEAD:${filePath}`, currentPath)
          modified = ''
        } else if (
          (status === 'index-renamed' || status === 'index-copied') &&
          renameFrom
        ) {
          original =
            (await readGitShow(`HEAD:${renameFrom}`, currentPath)) ??
            (await readDiskFile(currentPath, renameFrom))
          modified =
            (await readGitShow(`:${filePath}`, currentPath)) ??
            (await readDiskFile(currentPath, filePath))
        } else {
          original = await readGitShow(`HEAD:${filePath}`, currentPath)
          modified = await readGitShow(`:${filePath}`, currentPath)
        }
        break
      case 'changes':
        if (status === 'deleted') {
          original = await readGitShow(`:${filePath}`, currentPath)
          modified = ''
        } else if (status === 'intent-to-rename' && renameFrom) {
          original =
            (await readGitShow(`HEAD:${renameFrom}`, currentPath)) ??
            (await readGitShow(`:${renameFrom}`, currentPath)) ??
            (await readDiskFile(currentPath, renameFrom))
          modified =
            (await readDiskFile(currentPath, filePath)) ??
            (await readGitShow(`:${filePath}`, currentPath))
        } else {
          original = await readGitShow(`:${filePath}`, currentPath)
          if (original === null) {
            original = await readGitShow(`HEAD:${filePath}`, currentPath)
          }
          modified = await readDiskFile(currentPath, filePath)
        }
        break
      case 'untracked':
        original = ''
        modified = await readDiskFile(currentPath, filePath)
        break
      case 'merge':
        original =
          (await readGitShow(`:2:${filePath}`, currentPath)) ??
          (await readGitShow(`:1:${filePath}`, currentPath)) ??
          (await readGitShow(`HEAD:${filePath}`, currentPath))
        modified = await readDiskFile(currentPath, filePath)
        break
    }
  }

  const originalText = original ?? ''
  const modifiedText = modified ?? ''
  const isBinary = isBinaryDiffContent(filePath, originalText, modifiedText)
  const isTooLarge = isDiffContentTooLarge(originalText, modifiedText)

  return {
    original: originalText,
    modified: modifiedText,
    isBinary,
    isTooLarge,
  }
}
