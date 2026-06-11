import type { GitBranch, GitRefKind } from '../../types/git'
import { exec, requireRepo } from './core'

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
