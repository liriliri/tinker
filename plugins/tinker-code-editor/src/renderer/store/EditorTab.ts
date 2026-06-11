import { makeAutoObservable } from 'mobx'
import type { GitBlameHunk } from 'share/types/git'
export type TabCategory = 'text' | 'image'

interface BlameAnnotationSource {
  lineNumber: number
  isLeader: boolean
  sha: string
  text: string
  dateMs: number
}

class EditorTab {
  id: string
  title: string
  filePath: string
  content: string
  category: TabCategory
  isDirty: boolean

  // blame state
  blameHunks: GitBlameHunk[] = []
  showingBlame = false
  loadingBlame = false
  highlightedBlameSha: string | null = null

  constructor(
    id: string,
    title: string,
    filePath: string,
    content: string,
    category: TabCategory = 'text'
  ) {
    this.id = id
    this.title = title
    this.filePath = filePath
    this.content = content
    this.category = category
    this.isDirty = false
    makeAutoObservable(this)
  }

  get blameLineAnnotations(): BlameAnnotationSource[] {
    if (this.blameHunks.length === 0) return []

    const annotations: BlameAnnotationSource[] = []

    for (const hunk of this.blameHunks) {
      const shortMsg =
        hunk.message.length > 32
          ? hunk.message.slice(0, 32) + '\u2026'
          : hunk.message
      const text = `\u00A0${hunk.author}\u00A0${shortMsg}\u00A0`

      annotations.push({
        lineNumber: hunk.startLineNumber,
        isLeader: true,
        sha: hunk.sha,
        text,
        dateMs: hunk.dateMs,
      })

      for (let i = 1; i < hunk.lineCount; i++) {
        annotations.push({
          lineNumber: hunk.startLineNumber + i,
          isLeader: false,
          sha: hunk.sha,
          text: '',
          dateMs: 0,
        })
      }
    }

    return annotations
  }
}

export default EditorTab
