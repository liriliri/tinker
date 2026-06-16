import type { GitWorkingTreeGroup, GitWorkingTreeStatus } from '../../types/git'
import { exec, requireRepo } from './core'

async function execGitOrThrow(args: string[], cwd: string): Promise<void> {
  const { exitCode, stderr } = await exec(args, cwd)
  if (exitCode !== 0) {
    throw new Error(stderr.trim() || `git ${args[0]} failed`)
  }
}

export async function stageFile(filePath: string): Promise<void> {
  const currentPath = requireRepo()
  await execGitOrThrow(['add', '--', filePath], currentPath)
}

export async function unstageFile(filePath: string): Promise<void> {
  const currentPath = requireRepo()
  const { exitCode } = await exec(
    ['restore', '--staged', '--', filePath],
    currentPath
  )
  if (exitCode !== 0) {
    await execGitOrThrow(['reset', 'HEAD', '--', filePath], currentPath)
  }
}

export async function discardFile(
  filePath: string,
  group: GitWorkingTreeGroup,
  status?: GitWorkingTreeStatus
): Promise<void> {
  const currentPath = requireRepo()

  if (status === 'submodule-dirty') {
    await execGitOrThrow(['submodule', 'update', '--', filePath], currentPath)
    return
  }

  if (group === 'untracked') {
    await execGitOrThrow(['clean', '-f', '--', filePath], currentPath)
    return
  }

  const { exitCode } = await exec(['restore', '--', filePath], currentPath)
  if (exitCode !== 0) {
    await execGitOrThrow(['checkout', '--', filePath], currentPath)
  }
}

export async function stageFiles(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) return
  const currentPath = requireRepo()
  await execGitOrThrow(['add', '--', ...filePaths], currentPath)
}

export async function unstageAllFiles(): Promise<void> {
  const currentPath = requireRepo()
  const { exitCode } = await exec(['restore', '--staged', '.'], currentPath)
  if (exitCode !== 0) {
    await execGitOrThrow(['reset', 'HEAD'], currentPath)
  }
}

export async function discardFiles(
  filePaths: string[],
  group: GitWorkingTreeGroup,
  status?: GitWorkingTreeStatus
): Promise<void> {
  if (filePaths.length === 0) return
  const currentPath = requireRepo()

  if (status === 'submodule-dirty') {
    await execGitOrThrow(
      ['submodule', 'update', '--', ...filePaths],
      currentPath
    )
    return
  }

  if (group === 'untracked') {
    await execGitOrThrow(['clean', '-f', '--', ...filePaths], currentPath)
    return
  }

  const { exitCode } = await exec(['restore', '--', ...filePaths], currentPath)
  if (exitCode !== 0) {
    await execGitOrThrow(['checkout', '--', ...filePaths], currentPath)
  }
}

export async function commitStaged(message: string): Promise<void> {
  const trimmed = message.trim()
  if (!trimmed) {
    throw new Error('Commit message is required')
  }

  const currentPath = requireRepo()
  await execGitOrThrow(['commit', '-m', trimmed], currentPath)
}
