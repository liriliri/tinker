import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { Item } from 'jstodotxt'

const storage = new LocalStore('tinker-todo')

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

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadTodos()
  }

  private loadTodos() {
    const saved = storage.get('todos')
    if (saved) {
      this.todos = JSON.parse(saved)
    }
  }

  private saveTodos() {
    storage.set('todos', JSON.stringify(this.todos))
  }

  private parseTodoItem(raw: string, id?: string): TodoItem {
    const item = new Item(raw)

    return {
      id: id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: item.body(),
      completed: item.complete(),
      priority: item.priority() as Priority,
      projects: item.projects(),
      contexts: item.contexts(),
      dueDate: this.extractDueDate(item),
      createdDate: item.created() || null,
      completedDate: item.completed() || null,
      raw: item.toString(),
    }
  }

  private extractDueDate(item: Item): string | null {
    const extensions = item.extensions()
    const dueExt = extensions.find((ext) => ext.key === 'due')
    return dueExt ? dueExt.value : null
  }

  private createRawTodo(
    text: string,
    priority: Priority,
    dueDate?: string
  ): string {
    let raw = ''

    if (priority) {
      raw += `(${priority}) `
    }

    raw += text

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
      item.uncomplete()
    } else {
      item.complete()
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
