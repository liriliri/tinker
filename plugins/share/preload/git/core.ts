import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import type { OpenRepositoryResult } from '../../types/git'

export function exec(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      {
        cwd,
        encoding: 'utf8' as BufferEncoding,
        maxBuffer: 100 * 1024 * 1024,
      },
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

export function execRaw(
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

let repoPath = ''

export function requireRepo(): string {
  if (!repoPath) {
    throw new Error('No repository open')
  }
  return repoPath
}

export function getRepoPath(): string {
  return repoPath
}

export function findGitRepoRoot(filePath: string): string | null {
  let dir = path.resolve(filePath)

  try {
    if (fs.statSync(dir).isFile()) {
      dir = path.dirname(dir)
    }
  } catch {
    // Path may not exist; still treat the given path as a directory candidate.
  }

  const root = path.parse(dir).root
  while (true) {
    const gitPath = path.join(dir, '.git')
    try {
      if (fs.existsSync(gitPath)) {
        return dir
      }
    } catch {
      // ignore fs errors
    }
    if (dir === root) break
    dir = path.dirname(dir)
  }
  return null
}

export async function openRepository(
  repoPathToOpen: string
): Promise<OpenRepositoryResult> {
  if (repoPath === repoPathToOpen) {
    const { stdout } = await exec(
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      repoPathToOpen
    )
    return { repoPath, headRef: stdout.trim() }
  }

  const { exitCode } = await exec(['rev-parse', '--git-dir'], repoPathToOpen)
  if (exitCode !== 0) {
    throw new Error(`Not a git repository: ${repoPathToOpen}`)
  }

  repoPath = repoPathToOpen

  const { stdout } = await exec(
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    repoPathToOpen
  )
  return { repoPath, headRef: stdout.trim() }
}
