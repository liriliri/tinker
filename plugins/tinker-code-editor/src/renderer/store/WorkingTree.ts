import { makeAutoObservable, runInAction } from 'mobx'
import type { GitCheckoutInfo, GitWorkingTreeFile } from 'share/types/git'
import {
  fileBelongsToDisplayGroup,
  resolveWorkingTreeSelection,
  type RefreshWorkingTreeOptions,
  type WorkingTreeDisplayGroup,
} from 'share/lib/workingTree'

interface WorkingTreeOptions {
  getIsDark: () => boolean
  onOpenGitDiff: (
    file: GitWorkingTreeFile,
    repoPath: string
  ) => Promise<string | null>
  onWorkingTreeRefreshed?: (
    files: GitWorkingTreeFile[],
    repoPath: string
  ) => void
}

class WorkingTree {
  repoPath = ''
  isGitRepo = false
  resolvingGitRepo = false
  checkoutInfo: GitCheckoutInfo | null = null
  workingTreeFiles: GitWorkingTreeFile[] = []
  selectedWorkingTreeFile: GitWorkingTreeFile | null = null
  loadingWorkingTree = false
  workingTreeMutating = false
  workingTreeRefreshing = false
  commitMessage = ''
  committing = false

  private getIsDark: () => boolean
  private onOpenGitDiff: (
    file: GitWorkingTreeFile,
    repoPath: string
  ) => Promise<string | null>
  private onWorkingTreeRefreshed?: (
    files: GitWorkingTreeFile[],
    repoPath: string
  ) => void
  private workingTreeUnwatch?: () => void

  get hasStagedChanges(): boolean {
    return this.workingTreeFiles.some((file) => file.group === 'staged')
  }

  get isDark(): boolean {
    return this.getIsDark()
  }

  constructor(options: WorkingTreeOptions) {
    this.getIsDark = options.getIsDark
    this.onOpenGitDiff = options.onOpenGitDiff
    this.onWorkingTreeRefreshed = options.onWorkingTreeRefreshed
    makeAutoObservable(this)
  }

  async onProjectRootChanged(projectRoot: string) {
    this.workingTreeUnwatch?.()
    this.workingTreeUnwatch = undefined

    if (!projectRoot) {
      runInAction(() => {
        this.reset()
      })
      return
    }

    runInAction(() => {
      this.resolvingGitRepo = true
      this.isGitRepo = false
      this.repoPath = ''
    })

    try {
      const repoRoot = codeEditor.findGitRepoRoot(projectRoot)
      if (!repoRoot) {
        runInAction(() => {
          this.reset()
        })
        return
      }

      runInAction(() => {
        this.repoPath = repoRoot
        this.isGitRepo = true
      })
      this.syncWorkingTreeWatcher()
      await this.refreshWorkingTree()
    } catch (err) {
      console.error('Failed to resolve git repository:', err)
      runInAction(() => {
        this.reset()
      })
    } finally {
      runInAction(() => {
        this.resolvingGitRepo = false
      })
    }
  }

  reset() {
    this.repoPath = ''
    this.isGitRepo = false
    this.resolvingGitRepo = false
    this.checkoutInfo = null
    this.workingTreeFiles = []
    this.selectedWorkingTreeFile = null
    this.loadingWorkingTree = false
    this.workingTreeMutating = false
    this.workingTreeRefreshing = false
    this.commitMessage = ''
    this.committing = false
  }

  private syncWorkingTreeWatcher() {
    this.workingTreeUnwatch?.()
    this.workingTreeUnwatch = undefined

    if (!this.repoPath) return

    this.workingTreeUnwatch = codeEditor.watchWorkingTree(this.repoPath, () => {
      void this.refreshWorkingTree({ showLoading: false })
    })
  }

  private async syncPreloadRepo() {
    if (!this.repoPath) return
    if (codeEditor.getRepoPath() === this.repoPath) return
    await codeEditor.openRepository(this.repoPath)
  }

  async refreshWorkingTree(options: RefreshWorkingTreeOptions = {}) {
    if (!this.repoPath || !this.isGitRepo) return

    const showLoading = options.showLoading ?? true
    if (!showLoading && this.workingTreeRefreshing) return

    if (showLoading) {
      this.loadingWorkingTree = true
    } else {
      this.workingTreeRefreshing = true
    }

    try {
      await this.syncPreloadRepo()
      const result = await codeEditor.getWorkingTreeStatus()
      const selectionBeforeResolve = this.selectedWorkingTreeFile
      const nextSelected = resolveWorkingTreeSelection(
        result.files,
        selectionBeforeResolve,
        options
      )

      runInAction(() => {
        this.checkoutInfo = result.checkout
        this.workingTreeFiles = result.files
        this.selectedWorkingTreeFile = nextSelected
      })
      this.onWorkingTreeRefreshed?.(result.files, this.repoPath)
    } catch (err) {
      console.error('Failed to load working tree status:', err)
      runInAction(() => {
        if (showLoading) {
          this.workingTreeFiles = []
          this.checkoutInfo = null
          this.selectedWorkingTreeFile = null
        }
      })
    } finally {
      runInAction(() => {
        if (showLoading) {
          this.loadingWorkingTree = false
        } else {
          this.workingTreeRefreshing = false
        }
      })
    }
  }

  async selectWorkingTreeFile(file: GitWorkingTreeFile) {
    this.selectedWorkingTreeFile = file
    if (!this.repoPath) return

    await this.onOpenGitDiff(file, this.repoPath)
  }

  setCommitMessage(message: string) {
    this.commitMessage = message
  }

  private async withWorkingTreeMutation<T>(fn: () => Promise<T>): Promise<T> {
    this.workingTreeMutating = true
    try {
      return await fn()
    } finally {
      this.workingTreeMutating = false
    }
  }

  async stageWorkingTreeFile(file: GitWorkingTreeFile) {
    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await codeEditor.stageFile(file.path)
        const wasSelected = this.selectedWorkingTreeFile?.path === file.path
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected
            ? { selectPath: file.path, selectGroup: 'staged' as const }
            : {}),
        })
      } catch (err) {
        console.error('Failed to stage file:', err)
      }
    })
  }

  async unstageWorkingTreeFile(file: GitWorkingTreeFile) {
    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await codeEditor.unstageFile(file.path)
        const wasSelected = this.selectedWorkingTreeFile?.path === file.path
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected
            ? { selectPath: file.path, selectGroup: 'changes' as const }
            : {}),
        })
      } catch (err) {
        console.error('Failed to unstage file:', err)
      }
    })
  }

  async discardWorkingTreeFile(file: GitWorkingTreeFile) {
    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await codeEditor.discardFile(file.path, file.group)
        const wasSelected = this.selectedWorkingTreeFile?.path === file.path
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected ? { selectPath: file.path } : {}),
        })
      } catch (err) {
        console.error('Failed to discard file:', err)
      }
    })
  }

  private getWorkingTreeGroupPaths(group: WorkingTreeDisplayGroup): string[] {
    return this.workingTreeFiles
      .filter((file) => fileBelongsToDisplayGroup(file, group))
      .map((file) => file.path)
  }

  async stageWorkingTreeGroup(group: WorkingTreeDisplayGroup) {
    const paths = this.getWorkingTreeGroupPaths(group)
    if (paths.length === 0) return

    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await codeEditor.stageFiles(paths)
        await this.refreshWorkingTree({ showLoading: false })
      } catch (err) {
        console.error('Failed to stage group:', err)
      }
    })
  }

  async unstageWorkingTreeGroup() {
    if (!this.hasStagedChanges) return

    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        await codeEditor.unstageAllFiles()
        await this.refreshWorkingTree({ showLoading: false })
      } catch (err) {
        console.error('Failed to unstage group:', err)
      }
    })
  }

  async commitWorkingTree() {
    const message = this.commitMessage.trim()
    if (!message || !this.hasStagedChanges || this.committing) return

    return this.withWorkingTreeMutation(async () => {
      this.committing = true
      try {
        await this.syncPreloadRepo()
        await codeEditor.commitStaged(message)
        runInAction(() => {
          this.commitMessage = ''
        })
        await this.refreshWorkingTree({ showLoading: false })
      } catch (err) {
        console.error('Failed to commit:', err)
      } finally {
        runInAction(() => {
          this.committing = false
        })
      }
    })
  }

  async discardWorkingTreeGroup(group: WorkingTreeDisplayGroup) {
    const paths = this.getWorkingTreeGroupPaths(group)
    if (paths.length === 0) return

    return this.withWorkingTreeMutation(async () => {
      try {
        await this.syncPreloadRepo()
        if (group === 'changes') {
          const trackedPaths = this.workingTreeFiles
            .filter((file) => file.group === 'changes')
            .map((file) => file.path)
          const untrackedPaths = this.workingTreeFiles
            .filter((file) => file.group === 'untracked')
            .map((file) => file.path)
          if (trackedPaths.length > 0) {
            await codeEditor.discardFiles(trackedPaths, 'changes')
          }
          if (untrackedPaths.length > 0) {
            await codeEditor.discardFiles(untrackedPaths, 'untracked')
          }
        } else {
          await codeEditor.discardFiles(paths, group)
        }
        const wasSelected =
          this.selectedWorkingTreeFile != null &&
          fileBelongsToDisplayGroup(this.selectedWorkingTreeFile, group)
        await this.refreshWorkingTree({
          showLoading: false,
          ...(wasSelected
            ? { selectPath: this.selectedWorkingTreeFile!.path }
            : {}),
        })
      } catch (err) {
        console.error('Failed to discard group:', err)
      }
    })
  }

  dispose() {
    this.workingTreeUnwatch?.()
    this.workingTreeUnwatch = undefined
  }
}

export default WorkingTree
