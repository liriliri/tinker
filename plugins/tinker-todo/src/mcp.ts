import {
  createPluginMcpApi,
  formatMcpError,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Priority, Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list: (store) => getTodos(store),
    get_file: (store) => getTodoFile(store),
    open_file: openTodoFile,
    add: addTodo,
    update: updateTodo,
    toggle: toggleTodo,
    delete: deleteTodo,
    clear_completed: (store) => clearCompleted(store),
  })
}

function requireFile(store: Store): string | null {
  if (store.needsFileSelection || !store.filePath) {
    return 'Error: No todo file is open. Open or create a todo.txt file in the plugin first.'
  }
  return null
}

function requireTodo(store: Store, id: string) {
  const todo = store.todos.find((t) => t.id === id)
  if (!todo) {
    return `Error: Todo with id "${id}" not found.`
  }
  return todo
}

function getTodoFile(store: Store) {
  return {
    filePath: store.filePath || null,
    needsFileSelection: store.needsFileSelection,
    recentFiles: store.recentFiles,
  }
}

async function openTodoFile(store: Store, args: Record<string, unknown>) {
  try {
    await store.setFilePath(args.path as string)
    return getTodoFile(store)
  } catch (error) {
    if (error instanceof Error && error.message === 'fileNotFound') {
      return 'Error: Todo file not found.'
    }
    return formatMcpError(error, 'Failed to open file')
  }
}

function getTodos(store: Store) {
  return {
    filePath: store.filePath || null,
    needsFileSelection: store.needsFileSelection,
    currentFilter: store.currentFilter,
    showCompleted: store.showCompleted,
    stats: store.stats,
    todos: store.todos.map((todo) => ({
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      priority: todo.priority,
      dueDate: todo.dueDate,
      createdDate: todo.createdDate,
      completedDate: todo.completedDate,
      raw: todo.raw,
    })),
  }
}

function addTodo(store: Store, args: Record<string, unknown>) {
  const fileError = requireFile(store)
  if (fileError) return fileError

  store.setNewTodoText((args.text as string).trim())
  store.setNewTodoPriority((args.priority as Priority) ?? null)
  store.addTodo(args.dueDate as string | undefined)
  return getTodos(store)
}

function updateTodo(store: Store, args: Record<string, unknown>) {
  const fileError = requireFile(store)
  if (fileError) return fileError

  const id = args.id as string
  const todo = requireTodo(store, id)
  if (typeof todo === 'string') return todo

  const text =
    args.text !== undefined ? (args.text as string).trim() : todo.text
  const priority =
    args.priority !== undefined
      ? (args.priority as Priority) ?? null
      : todo.priority
  const dueDate =
    args.dueDate === undefined
      ? todo.dueDate ?? undefined
      : (args.dueDate as string | null) ?? undefined

  store.updateTodo(id, text, priority, dueDate)
  return getTodos(store)
}

function toggleTodo(store: Store, args: Record<string, unknown>) {
  const fileError = requireFile(store)
  if (fileError) return fileError

  const id = args.id as string
  const todo = requireTodo(store, id)
  if (typeof todo === 'string') return todo

  store.toggleTodo(id)
  return getTodos(store)
}

function deleteTodo(store: Store, args: Record<string, unknown>) {
  const fileError = requireFile(store)
  if (fileError) return fileError

  const id = args.id as string
  const todo = requireTodo(store, id)
  if (typeof todo === 'string') return todo

  store.deleteTodo(id)
  return getTodos(store)
}

function clearCompleted(store: Store) {
  const fileError = requireFile(store)
  if (fileError) return fileError

  store.clearCompleted()
  return getTodos(store)
}
