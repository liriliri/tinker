import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { Item } from 'jstodotxt'

const storage = new LocalStore('tinker-todo')
const DEFAULT_FILE_PATH = `${todo.getHomedir()}/todo.txt`

export type Priority = 'A' | 'B' | 'C' | null
export type FilterType = 'all' | 'today' | 'important' | 'completed'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: Priority
  projects: string[]
  contexts: string[]
  dueDate: string | null
  createdDate: string | null
  completedDate: string | null
  raw: string
}

class Store extends BaseStore {
  todos: TodoItem[] = []
  currentFilter: FilterType = 'all'
  searchQuery: string = ''
  newTodoText: string = ''
  newTodoPriority: Priority = null
  showCompleted: boolean = true
  filePath: string = ''
  isLoading: boolean = false
  error: string | null = null
  needsFileSelection: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.initializeFile()
  }

  private async initializeFile() {
    const savedPath = storage.get('filePath')
    if (savedPath) {
      this.filePath = savedPath as string
      await this.loadTodos()
    } else {
      this.needsFileSelection = true
    }
  }

  async setFilePath(path: string) {
    this.filePath = path
    storage.set('filePath', path)
    this.needsFileSelection = false
    await this.loadTodos()
  }

  async openExistingFile() {
    try {
      const result = await tinker.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Todo.txt Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePaths.length > 0) {
        await this.setFilePath(result.filePaths[0])
      }
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Failed to open file'
    }
  }

  async createNewFile() {
    try {
      const result = await tinker.showSaveDialog({
        defaultPath: DEFAULT_FILE_PATH,
        filters: [
          { name: 'Todo.txt Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePath) {
        todo.writeFile(result.filePath, '')
        await this.setFilePath(result.filePath)
      }
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Failed to create file'
    }
  }

  private async loadTodos() {
    if (!this.filePath) return

    this.isLoading = true
    this.error = null

    try {
      const content = todo.readFile(this.filePath)
      const lines = content.split('\n').filter((line) => line.trim())

      runInAction(() => {
        this.todos = lines.map((line, index) =>
          this.parseTodoItem(line, `${Date.now()}-${index}`)
        )
        this.isLoading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : 'Failed to load todos'
        this.isLoading = false
      })
    }
  }

  private async saveTodos() {
    if (!this.filePath) return

    try {
      const content = this.todos.map((todo) => todo.raw).join('\n')
      todo.writeFile(this.filePath, content)
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Failed to save todos'
    }
  }

  async reloadTodos() {
    await this.loadTodos()
  }

  private parseTodoItem(raw: string, id?: string): TodoItem {
    const item = new Item(raw)

    return {
      id: id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: item.body() || '',
      completed: item.complete() || false,
      priority: item.priority() as Priority,
      projects: item.projects() || [],
      contexts: item.contexts() || [],
      dueDate: this.extractDueDate(item),
      createdDate: item.created() || null,
      completedDate: item.completed() || null,
      raw: item.toString(),
    }
  }

  private formatDate(date: string): string {
    return date
  }

  private extractDueDate(item: Item): string | null {
    const extensions = item.extensions()
    if (!extensions) return null
    const dueExt = extensions.find((ext: any) => ext.key === 'due')
    return dueExt ? dueExt.value : null
  }

  private createRawTodo(
    text: string,
    priority: Priority,
    dueDate?: string
  ): string {
    let raw = ''

    const today = new Date().toISOString().split('T')[0]

    if (priority) {
      raw += `(${priority}) `
    }

    raw += `${today} ${text}`

    if (dueDate) {
      raw += ` due:${dueDate}`
    }

    return raw
  }

  setCurrentFilter(filter: FilterType) {
    this.currentFilter = filter
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  setNewTodoText(text: string) {
    this.newTodoText = text
  }

  setNewTodoPriority(priority: Priority) {
    this.newTodoPriority = priority
  }

  setShowCompleted(show: boolean) {
    this.showCompleted = show
  }

  addTodo(dueDate?: string) {
    if (!this.newTodoText.trim()) return

    const raw = this.createRawTodo(
      this.newTodoText.trim(),
      this.newTodoPriority,
      dueDate
    )
    const todo = this.parseTodoItem(raw)

    this.todos.unshift(todo)
    this.saveTodos()

    this.newTodoText = ''
    this.newTodoPriority = null
  }

  toggleTodo(id: string) {
    const todo = this.todos.find((t) => t.id === id)
    if (!todo) return

    const item = new Item(todo.raw)

    if (item.complete()) {
      item.setComplete(false)
      item.setCompleted(null)
    } else {
      item.setComplete(true)
      const today = new Date().toISOString().split('T')[0]
      item.setCompleted(today)
    }

    const updated = this.parseTodoItem(item.toString(), id)
    const index = this.todos.findIndex((t) => t.id === id)
    this.todos[index] = updated

    this.saveTodos()
  }

  deleteTodo(id: string) {
    this.todos = this.todos.filter((t) => t.id !== id)
    this.saveTodos()
  }

  updateTodoPriority(id: string, priority: Priority) {
    const todo = this.todos.find((t) => t.id === id)
    if (!todo) return

    const item = new Item(todo.raw)
    item.setPriority(priority)

    const updated = this.parseTodoItem(item.toString(), id)
    const index = this.todos.findIndex((t) => t.id === id)
    this.todos[index] = updated

    this.saveTodos()
  }

  clearCompleted() {
    this.todos = this.todos.filter((t) => !t.completed)
    this.saveTodos()
  }

  get filteredTodos(): TodoItem[] {
    let filtered = this.todos.slice()

    if (this.currentFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter((t) => t.dueDate === today)
    } else if (this.currentFilter === 'important') {
      filtered = filtered.filter((t) => t.priority === 'A')
    } else if (this.currentFilter === 'completed') {
      filtered = filtered.filter((t) => t.completed)
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.text.toLowerCase().includes(query) ||
          t.projects.some((p) => p.toLowerCase().includes(query)) ||
          t.contexts.some((c) => c.toLowerCase().includes(query))
      )
    }

    if (!this.showCompleted && this.currentFilter !== 'completed') {
      filtered = filtered.filter((t) => !t.completed)
    }

    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1

      const priorityOrder: Record<string, number> = { A: 0, B: 1, C: 2 }
      const aPri = a.priority ? priorityOrder[a.priority] : 3
      const bPri = b.priority ? priorityOrder[b.priority] : 3

      if (aPri !== bPri) return aPri - bPri

      return this.todos.indexOf(a) - this.todos.indexOf(b)
    })
  }

  get stats() {
    const total = this.todos.length
    const completed = this.todos.filter((t) => t.completed).length
    const today = new Date().toISOString().split('T')[0]
    const todayCount = this.todos.filter(
      (t) => t.dueDate === today && !t.completed
    ).length
    const important = this.todos.filter(
      (t) => t.priority === 'A' && !t.completed
    ).length

    return { total, completed, today: todayCount, important }
  }
}

export default new Store()
