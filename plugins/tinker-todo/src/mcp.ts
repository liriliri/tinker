import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Priority, Store, TodoItem } from './store'
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

function requireFile(store: Store) {
  if (store.needsFileSelection || !store.filePath) {
    throw new Error(
      'No todo file is open. Open or create a todo.txt file in the plugin first.'
    )
  }
}

function requireTodo(store: Store, id: string): TodoItem {
  const todo = store.todos.find((t) => t.id === id)
  if (!todo) {
    throw new Error(`Todo with id "${id}" not found.`)
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

async function openTodoFile(store: Store, args: { path: string }) {
  try {
    await store.setFilePath(args.path)
  } catch (error) {
    if (error instanceof Error && error.message === 'fileNotFound') {
      throw new Error('Todo file not found.')
    }
    throw error
  }
  return getTodoFile(store)
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

function addTodo(
  store: Store,
  args: { text: string; priority?: Priority; dueDate?: string }
) {
  requireFile(store)

  store.setNewTodoText(args.text.trim())
  store.setNewTodoPriority(args.priority ?? null)
  store.addTodo(args.dueDate)
  return getTodos(store)
}

function updateTodo(
  store: Store,
  args: {
    id: string
    text?: string
    priority?: Priority | null
    dueDate?: string | null
  }
) {
  requireFile(store)

  const todo = requireTodo(store, args.id)

  const text = args.text !== undefined ? args.text.trim() : todo.text
  const priority = args.priority !== undefined ? args.priority : todo.priority
  const dueDate =
    args.dueDate === undefined
      ? todo.dueDate ?? undefined
      : args.dueDate ?? undefined

  store.updateTodo(args.id, text, priority, dueDate)
  return getTodos(store)
}

function toggleTodo(store: Store, args: { id: string }) {
  requireFile(store)

  requireTodo(store, args.id)

  store.toggleTodo(args.id)
  return getTodos(store)
}

function deleteTodo(store: Store, args: { id: string }) {
  requireFile(store)

  requireTodo(store, args.id)

  store.deleteTodo(args.id)
  return getTodos(store)
}

function clearCompleted(store: Store) {
  requireFile(store)

  store.clearCompleted()
  return getTodos(store)
}
