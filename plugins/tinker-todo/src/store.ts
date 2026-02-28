import { makeAutoObservable, runInAction, reaction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { Item } from 'jstodotxt'
import { type Priority, type FilterType, type TodoItem } from './types'
import { parseTodoItem, createRawTodo } from './lib/todo'

const storage = new LocalStore('tinker-todo')
const STORAGE_KEY_CURRENT_FILTER = 'currentFilter'
const STORAGE_KEY_SHOW_COMPLETED = 'showCompleted'
const STORAGE_KEY_FILE_PATH = 'filePath'
const STORAGE_KEY_RECENT_FILES = 'recentFiles'

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
  recentFiles: string[] = []

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
    this.initializeFile()
    this.bindEvent()
  }

  private loadFromStorage() {
    const savedFilter = storage.get(STORAGE_KEY_CURRENT_FILTER)
    if (
      savedFilter &&
      (['all', 'today', 'important', 'completed'] as FilterType[]).includes(
        savedFilter as FilterType
      )
    ) {
      this.currentFilter = savedFilter as FilterType
    }

    const savedShowCompleted = storage.get(STORAGE_KEY_SHOW_COMPLETED)
    if (savedShowCompleted !== undefined) {
      this.showCompleted = savedShowCompleted as boolean
    }

    const savedRecentFiles = storage.get(STORAGE_KEY_RECENT_FILES)
    if (savedRecentFiles) {
      this.recentFiles = savedRecentFiles as string[]
    }
  }

  private addRecentFile(path: string) {
    this.recentFiles = [
      path,
      ...this.recentFiles.filter((p) => p !== path),
    ].slice(0, 5)
    storage.set(STORAGE_KEY_RECENT_FILES, this.recentFiles)
  }

  removeRecentFile(path: string) {
    this.recentFiles = this.recentFiles.filter((p) => p !== path)
    storage.set(STORAGE_KEY_RECENT_FILES, this.recentFiles)
  }

  private bindEvent() {
    reaction(
      () => this.filePath,
      (filePath) => {
        if (filePath) {
          const parts = filePath.split('/')
          const fileName = parts[parts.length - 1]
          tinker.setTitle(fileName)
        } else {
          tinker.setTitle('')
        }
      }
    )
  }

  private async initializeFile() {
    const savedPath = storage.get(STORAGE_KEY_FILE_PATH)
    if (savedPath) {
      try {
        const content = await tinker.readFile(savedPath as string, 'utf-8')
        const lines = content.split('\n').filter((line) => line.trim())

        runInAction(() => {
          this.filePath = savedPath as string
          this.todos = lines.map((line, index) =>
            parseTodoItem(line, `${Date.now()}-${index}`)
          )
        })
      } catch (error) {
        storage.remove(STORAGE_KEY_FILE_PATH)
        runInAction(() => {
          this.needsFileSelection = true
          this.error =
            error instanceof Error ? error.message : 'Failed to load todos'
        })
      }
    } else {
      this.needsFileSelection = true
    }
  }

  async setFilePath(path: string) {
    try {
      await tinker.readFile(path, 'utf-8')
    } catch {
      runInAction(() => {
        this.recentFiles = this.recentFiles.filter((p) => p !== path)
        storage.set(STORAGE_KEY_RECENT_FILES, this.recentFiles)
      })
      throw new Error('fileNotFound')
    }
    this.filePath = path
    storage.set(STORAGE_KEY_FILE_PATH, path)
    this.needsFileSelection = false
    this.addRecentFile(path)
    await this.loadTodos()
  }

  closeFile() {
    this.filePath = ''
    this.todos = []
    this.needsFileSelection = true
    storage.remove(STORAGE_KEY_FILE_PATH)
    tinker.setTitle('')
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
        filters: [
          { name: 'Todo.txt Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePath) {
        await tinker.writeFile(result.filePath, '', 'utf-8')
        await this.setFilePath(result.filePath)
      }
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Failed to create file'
    }
  }

  async loadTodos() {
    if (!this.filePath) return

    this.isLoading = true
    this.error = null

    try {
      const content = await tinker.readFile(this.filePath, 'utf-8')
      const lines = content.split('\n').filter((line) => line.trim())

      runInAction(() => {
        this.todos = lines.map((line, index) =>
          parseTodoItem(line, `${Date.now()}-${index}`)
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
      await tinker.writeFile(this.filePath, content, 'utf-8')
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : 'Failed to save todos'
    }
  }

  setCurrentFilter(filter: FilterType) {
    this.currentFilter = filter
    storage.set(STORAGE_KEY_CURRENT_FILTER, filter)
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
    storage.set(STORAGE_KEY_SHOW_COMPLETED, show)
  }

  addTodo(dueDate?: string) {
    if (!this.newTodoText.trim()) return

    const raw = createRawTodo(
      this.newTodoText.trim(),
      this.newTodoPriority,
      dueDate
    )
    const todo = parseTodoItem(raw)

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

    const updated = parseTodoItem(item.toString(), id)
    const index = this.todos.findIndex((t) => t.id === id)
    this.todos[index] = updated

    this.saveTodos()
  }

  deleteTodo(id: string) {
    this.todos = this.todos.filter((t) => t.id !== id)
    this.saveTodos()
  }

  updateTodo(id: string, text: string, priority: Priority, dueDate?: string) {
    const todo = this.todos.find((t) => t.id === id)
    if (!todo) return

    const item = new Item(todo.raw)
    item.setPriority(priority)

    const body = dueDate ? `${text} due:${dueDate}` : text
    item.setBody(body)

    const updated = parseTodoItem(item.toString(), id)
    const index = this.todos.findIndex((t) => t.id === id)
    this.todos[index] = updated

    this.saveTodos()
  }

  updateTodoPriority(id: string, priority: Priority) {
    const todo = this.todos.find((t) => t.id === id)
    if (!todo) return

    const item = new Item(todo.raw)
    item.setPriority(priority)

    const updated = parseTodoItem(item.toString(), id)
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
      filtered = filtered.filter((t) => t.text.toLowerCase().includes(query))
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
