import { contextBridge } from 'electron'
import NodeGit from 'nodegit'
import type {
  GitBranch,
  GitCommitDetail,
  GitCommitSummary,
  GitRefKind,
  OpenRepositoryResult,
} from '../common/types'

let repo: NodeGit.Repository | null = null
let repoPath = ''

function requireRepo(): NodeGit.Repository {
  if (!repo) {
    throw new Error('No repository open')
  }
  return repo
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

function getSignatureDateMs(signature: NodeGit.Signature): number {
  const when = signature.when() as {
    time?: () => number
    sec?: () => number
  }

  if (typeof when.time === 'function') {
    return when.time() * 1000
  }

  if (typeof when.sec === 'function') {
    return when.sec() * 1000
  }

  return 0
}

async function buildDiffText(commit: NodeGit.Commit): Promise<string> {
  const parts: string[] = []

  try {
    const diffs = await commit.getDiff()
    for (const diff of diffs) {
      const patches = await diff.patches()
      for (const patch of patches) {
        parts.push(
          `diff --git a/${patch.oldFile().path()} b/${patch.newFile().path()}`
        )
        const hunks = await patch.hunks()
        for (const hunk of hunks) {
          parts.push(hunk.header().trim())
          const lines = await hunk.lines()
          for (const line of lines) {
            parts.push(
              String.fromCharCode(line.origin()) + line.content().trimEnd()
            )
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to build diff:', error)
  }

  return parts.join('\n')
}

const gitObj = {
  getRepoPath(): string {
    return repoPath
  },

  async openRepository(path: string): Promise<OpenRepositoryResult> {
    if (repo && repoPath === path) {
      const head = await repo.getCurrentBranch()
      return {
        repoPath,
        headRef: head.name(),
      }
    }

    repo = null
    repoPath = ''

    repo = await NodeGit.Repository.open(path)
    repoPath = path

    const head = await repo.getCurrentBranch()
    return {
      repoPath,
      headRef: head.name(),
    }
  },

  async getBranches(): Promise<GitBranch[]> {
    const currentRepo = requireRepo()
    const head = await currentRepo.getCurrentBranch()
    const headName = head.name()
    const refNames = await currentRepo.getReferenceNames(
      NodeGit.Reference.TYPE.ALL
    )
    const branches: GitBranch[] = []
    const seen = new Set<string>()

    for (const fullName of refNames) {
      if (
        !fullName.startsWith('refs/heads/') &&
        !fullName.startsWith('refs/remotes/') &&
        !fullName.startsWith('refs/tags/')
      ) {
        continue
      }

      if (/^refs\/remotes\/[^/]+\/HEAD$/.test(fullName)) {
        continue
      }

      if (seen.has(fullName)) {
        continue
      }
      seen.add(fullName)

      const ref = await currentRepo.getReference(fullName)
      const resolved = ref.isSymbolic() ? await ref.resolve() : ref
      const oid = resolved.target()
      const { name, kind, isRemote } = formatRefName(fullName)

      branches.push({
        name,
        fullName,
        kind,
        isRemote,
        isHead: fullName === headName,
        sha: oid.tostrS().slice(0, 7),
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

  async getCommits(refName: string, limit = 100): Promise<GitCommitSummary[]> {
    const currentRepo = requireRepo()
    const commit = await currentRepo.getReferenceCommit(refName)
    const revwalk = currentRepo.createRevWalk()
    revwalk.sorting(NodeGit.Revwalk.SORT.TIME)
    revwalk.push(await commit.id())
    const commits = await revwalk.getCommits(limit)

    return commits.map((item) => {
      const author = item.author()
      const message = item.message()
      const sha = item.sha()
      return {
        sha,
        shortSha: sha.slice(0, 7),
        summary: message.split('\n')[0],
        author: author.name(),
        email: author.email(),
        date: getSignatureDateMs(author),
      }
    })
  },

  async getCommitDetail(sha: string): Promise<GitCommitDetail> {
    const currentRepo = requireRepo()
    const commit = await currentRepo.getCommit(sha)
    const author = commit.author()
    const message = commit.message()
    const summary = message.split('\n')[0]
    const body = message.split('\n').slice(1).join('\n').trim()
    const diff = await buildDiffText(commit)

    return {
      sha,
      shortSha: sha.slice(0, 7),
      summary,
      body,
      message,
      author: author.name(),
      email: author.email(),
      date: getSignatureDateMs(author),
      diff,
    }
  },
}

contextBridge.exposeInMainWorld('git', gitObj)

declare global {
  const git: typeof gitObj
}
