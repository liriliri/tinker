import { makeAutoObservable, runInAction } from 'mobx'
import uuid from 'licia/uuid'
import last from 'licia/last'
import normalizePath from 'licia/normalizePath'
import {
  byteRangeToColumns,
  type TextSearchActiveMatch,
} from 'share/lib/textSearch'
import { joinPath } from 'share/lib/util'
import { fileDisplayName, findWorkingTreeFile } from 'share/lib/workingTree'
import {
  IMAGE_EXTS,
  VIDEO_EXTS,
  BINARY_EXTS,
  getFileExt,
} from 'share/lib/fileType'
import type { GitWorkingTreeFile } from 'share/types/git'
import type { editor as MonacoEditor } from 'monaco-editor'
import EditorTab from './EditorTab'

interface RevealTarget {
  lineNumber: number
  submatches?: tinker.SearchTextSubmatch[]
}

class Editor {
  tabs: EditorTab[] = []
  activeTabId = ''
  cursorLine = 1
  cursorColumn = 1

  private editorInstances: Map<string, MonacoEditor.IStandaloneCodeEditor> =
    new Map()
  private pendingReveals: Map<string, RevealTarget> = new Map()
  private gitDiffLoadIds = new Map<string, number>()
  recentlySavedPaths = new Map<string, number>()

  constructor() {
    makeAutoObservable(this)
  }

  get activeTab(): EditorTab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId)
  }

  get showingBlame() {
    return this.activeTab?.showingBlame ?? false
  }

  get loadingBlame() {
    return this.activeTab?.loadingBlame ?? false
  }

  get blameLineAnnotations() {
    return this.activeTab?.blameLineAnnotations ?? []
  }

  get highlightedBlameSha() {
    return this.activeTab?.highlightedBlameSha ?? null
  }

  get showingMarkdownPreview() {
    return this.activeTab?.showingMarkdownPreview ?? false
  }

  get tabDirtyRevision(): string {
    return this.tabs.map((t) => `${t.id}:${t.isDirty ? 1 : 0}`).join('|')
  }

  async openGitDiff(
    file: GitWorkingTreeFile,
    repoPath: string
  ): Promise<string | null> {
    let tab = this.tabs.find((item) => item.category === 'gitDiff')
    if (!tab) {
      tab = new EditorTab(uuid(), 'Git Diff', '', '', 'gitDiff')
      this.tabs.push(tab)
    }

    this.activeTabId = tab.id
    await this.loadGitDiff(tab, file, repoPath)
    return tab.id
  }

  refreshOpenGitDiffTabs(files: GitWorkingTreeFile[], repoPath: string) {
    const tab = this.tabs.find((item) => item.category === 'gitDiff')
    if (!tab?.gitFile) return

    const file = findWorkingTreeFile(files, tab.gitFile)
    if (!file) {
      this.closeTab(tab.id)
      return
    }

    void this.loadGitDiff(tab, file, repoPath, { force: true })
  }

  private async loadGitDiff(
    tab: EditorTab,
    file: GitWorkingTreeFile,
    repoPath: string,
    options: { force?: boolean } = {}
  ) {
    const loadId = (this.gitDiffLoadIds.get(tab.id) ?? 0) + 1
    this.gitDiffLoadIds.set(tab.id, loadId)

    const sameFile =
      !options.force &&
      tab.gitFile?.id === file.id &&
      tab.diffContent &&
      !tab.loadingDiff

    tab.gitFile = file
    tab.filePath = joinPath(repoPath, file.path)
    tab.title = fileDisplayName(file)

    if (sameFile) return

    tab.diffContent = null
    tab.loadingDiff = true
    try {
      if (codeEditor.getRepoPath() !== repoPath) {
        await codeEditor.openRepository(repoPath)
      }
      const diff = await codeEditor.getWorkingTreeFileDiffContent(
        file.path,
        file.group,
        file.status,
        file.renameFrom
      )
      if (this.gitDiffLoadIds.get(tab.id) !== loadId) return

      runInAction(() => {
        tab.diffContent = diff
      })
    } catch (err) {
      if (this.gitDiffLoadIds.get(tab.id) !== loadId) return

      console.error('Failed to load git diff:', err)
      runInAction(() => {
        tab.diffContent = null
      })
    } finally {
      if (this.gitDiffLoadIds.get(tab.id) === loadId) {
        runInAction(() => {
          tab.loadingDiff = false
        })
      }
    }
  }

  async openFile(filePath: string, fileName: string): Promise<string | null> {
    const existing = this.tabs.find((t) => t.filePath === filePath)
    if (existing) {
      this.activeTabId = existing.id
      return existing.id
    }

    const ext = getFileExt(filePath)
    const isImage = IMAGE_EXTS.has(ext)
    const isVideo = VIDEO_EXTS.has(ext)
    const isBinary = !isImage && !isVideo && BINARY_EXTS.has(ext)

    try {
      const content =
        isImage || isVideo
          ? filePath
          : ((await tinker.readFile(filePath, 'utf-8')) as string)
      const category = isImage
        ? 'image'
        : isVideo
        ? 'video'
        : isBinary
        ? 'binary'
        : 'text'
      const tab = new EditorTab(uuid(), fileName, filePath, content, category)
      this.tabs.push(tab)
      this.activeTabId = tab.id
      return tab.id
    } catch {
      return null
    }
  }

  async reloadOpenFile(filePath: string) {
    const normalized = normalizePath(filePath)
    const tab = this.tabs.find((t) => normalizePath(t.filePath) === normalized)
    if (
      !tab ||
      tab.isDirty ||
      tab.category === 'image' ||
      tab.category === 'video'
    )
      return

    try {
      tab.content = (await tinker.readFile(filePath, 'utf-8')) as string
    } catch {
      // ignore read errors
    }
  }

  async selectSearchMatch(match: TextSearchActiveMatch) {
    const fileName = last(match.path.split('/')) || match.path
    const tabId = await this.openFile(match.path, fileName)
    if (!tabId) return
    this.revealInTab(tabId, match.lineNumber, match.submatches)
  }

  updateContent(tabId: string, content: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (tab) {
      tab.content = content
      tab.isDirty = true
    }
  }

  forceOpenBinaryAsText(tabId: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (!tab || tab.category !== 'binary') return
    tab.category = 'text'
  }

  async saveFile(tabId?: string) {
    const id = tabId || this.activeTabId
    const tab = this.tabs.find((t) => t.id === id)
    if (
      !tab ||
      tab.category === 'image' ||
      tab.category === 'video' ||
      tab.category === 'gitDiff' ||
      tab.category === 'binary'
    )
      return

    try {
      await tinker.writeFile(tab.filePath, tab.content, 'utf-8')
      tab.isDirty = false
      this.recentlySavedPaths.set(normalizePath(tab.filePath), Date.now())
    } catch {
      // ignore write errors
    }
  }

  closeTab(id: string) {
    const index = this.tabs.findIndex((t) => t.id === id)
    if (index === -1) return

    this.tabs.splice(index, 1)
    this.unregisterEditor(id)
    this.gitDiffLoadIds.delete(id)

    if (this.activeTabId === id) {
      if (this.tabs.length > 0) {
        const newIndex = Math.min(index, this.tabs.length - 1)
        this.activeTabId = this.tabs[newIndex].id
      } else {
        this.activeTabId = ''
      }
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
  }

  moveTab(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tabs.length ||
      toIndex >= this.tabs.length
    ) {
      return
    }
    const [tab] = this.tabs.splice(fromIndex, 1)
    this.tabs.splice(toIndex, 0, tab)
  }

  setCursor(line: number, column: number) {
    this.cursorLine = line
    this.cursorColumn = column
  }

  registerEditor(tabId: string, instance: MonacoEditor.IStandaloneCodeEditor) {
    this.editorInstances.set(tabId, instance)
    const pending = this.pendingReveals.get(tabId)
    if (pending) {
      this.applyReveal(instance, pending)
      this.pendingReveals.delete(tabId)
    }
  }

  unregisterEditor(tabId: string) {
    this.editorInstances.delete(tabId)
    this.pendingReveals.delete(tabId)
  }

  private revealInTab(
    tabId: string,
    lineNumber: number,
    submatches?: tinker.SearchTextSubmatch[]
  ) {
    const target: RevealTarget = { lineNumber, submatches }
    const inst = this.editorInstances.get(tabId)
    if (inst) {
      this.applyReveal(inst, target)
    } else {
      this.pendingReveals.set(tabId, target)
    }
  }

  private applyReveal(
    inst: MonacoEditor.IStandaloneCodeEditor,
    target: RevealTarget
  ) {
    const { lineNumber, submatches } = target
    inst.revealLineInCenter(lineNumber)
    if (submatches && submatches.length > 0) {
      const lineText = inst.getModel()?.getLineContent(lineNumber) || ''
      const sm = submatches[0]
      const { startColumn, endColumn } = byteRangeToColumns(
        lineText,
        sm.start,
        sm.end
      )
      inst.setSelection({
        startLineNumber: lineNumber,
        startColumn,
        endLineNumber: lineNumber,
        endColumn,
      })
    } else {
      inst.setPosition({ lineNumber, column: 1 })
    }
    inst.focus()
  }

  setHighlightedBlameSha(sha: string | null) {
    const tab = this.activeTab
    if (!tab) return
    tab.highlightedBlameSha = tab.highlightedBlameSha === sha ? null : sha
  }

  toggleMarkdownPreview() {
    const tab = this.activeTab
    if (!tab) return

    if (!tab.showingMarkdownPreview) {
      const inst = this.editorInstances.get(tab.id)
      if (inst) {
        const scrollHeight = inst.getScrollHeight()
        const visibleHeight = inst.getLayoutInfo().height
        const maxScroll = scrollHeight - visibleHeight
        tab.markdownScrollPercent =
          maxScroll > 0 ? inst.getScrollTop() / maxScroll : 0
      }
    }

    tab.showingMarkdownPreview = !tab.showingMarkdownPreview
  }

  setMarkdownScrollPercent(tabId: string, percent: number) {
    const tab = this.tabs.find((item) => item.id === tabId)
    if (!tab) return
    if (Math.abs(tab.markdownScrollPercent - percent) > 0.001) {
      tab.markdownScrollPercent = percent
    }
  }

  async toggleBlame() {
    const tab = this.activeTab
    if (!tab) return

    if (tab.showingBlame) {
      tab.showingBlame = false
      return
    }

    tab.loadingBlame = true
    try {
      const repoRoot = await codeEditor.findGitRepoRoot(tab.filePath)
      if (!repoRoot) {
        throw new Error('Not in a git repository')
      }

      await codeEditor.openRepository(repoRoot)
      const hunks = await codeEditor.getCommitFileBlame('HEAD', tab.filePath)
      runInAction(() => {
        tab.blameHunks = hunks
        tab.showingBlame = true
      })
    } catch (err) {
      console.error('Failed to load blame:', err)
    } finally {
      runInAction(() => {
        tab.loadingBlame = false
      })
    }
  }
}

export default Editor
