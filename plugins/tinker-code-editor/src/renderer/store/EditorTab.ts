import { makeAutoObservable } from 'mobx'

class EditorTab {
  id: string
  title: string
  filePath: string
  content: string
  isDirty: boolean

  constructor(id: string, title: string, filePath: string, content: string) {
    this.id = id
    this.title = title
    this.filePath = filePath
    this.content = content
    this.isDirty = false
    makeAutoObservable(this)
  }
}

export default EditorTab
