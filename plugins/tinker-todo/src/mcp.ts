import {
  getMcpToolsFromPackage,
  mcpToolsToOpenAiDefinitions,
  registerPluginMcp,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Priority, Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  const toolDefinitions = mcpToolsToOpenAiDefinitions(
    getMcpToolsFromPackage(pkg)
  )

  return registerPluginMcp({
    callTool: (name, args) => executeTool(getStore(), name, args),
    createAgentTools: () =>
      toolDefinitions.map((definition) => ({
        definition,
        execute: (args) =>
          executeTool(getStore(), definition.function.name, args),
      })),
  })
}

function executeTool(
  store: Store,
  name: string,
  args: Record<string, unknown>
): string | Promise<string> {
  switch (name) {
    case 'get_todos':
      return getTodos(store)
    case 'get_todo_file':
      return getTodoFile(store)
    case 'open_todo_file':
      return openTodoFile(store, args)
    case 'add_todo':
      return addTodo(store, args)
    case 'update_todo':
      return updateTodo(store, args)
    case 'toggle_todo':
      return toggleTodo(store, args)
    case 'delete_todo':
      return deleteTodo(store, args)
    case 'clear_completed':
      return clearCompleted(store)
    default:
      return `Error: Unknown tool "${name}"`
  }
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

function getTodoFile(store: Store): string {
  return JSON.stringify(
    {
      filePath: store.filePath || null,
      needsFileSelection: store.needsFileSelection,
      recentFiles: store.recentFiles,
    },
    null,
    2
  )
}

async function openTodoFile(
  store: Store,
  args: Record<string, unknown>
): Promise<string> {
  try {
    await store.setFilePath(args.path as string)
    return getTodoFile(store)
  } catch (error) {
    if (error instanceof Error && error.message === 'fileNotFound') {
      return 'Error: Todo file not found.'
    }
    return `Error: ${
      error instanceof Error ? error.message : 'Failed to open file'
    }`
  }
}

function getTodos(store: Store): string {
  return JSON.stringify(
    {
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
    },
    null,
    2
  )
}

function addTodo(store: Store, args: Record<string, unknown>): string {
  const fileError = requireFile(store)
  if (fileError) return fileError

  store.setNewTodoText((args.text as string).trim())
  store.setNewTodoPriority((args.priority as Priority) ?? null)
  store.addTodo(args.dueDate as string | undefined)
  return getTodos(store)
}

function updateTodo(store: Store, args: Record<string, unknown>): string {
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

function toggleTodo(store: Store, args: Record<string, unknown>): string {
  const fileError = requireFile(store)
  if (fileError) return fileError

  const id = args.id as string
  const todo = requireTodo(store, id)
  if (typeof todo === 'string') return todo

  store.toggleTodo(id)
  return getTodos(store)
}

function deleteTodo(store: Store, args: Record<string, unknown>): string {
  const fileError = requireFile(store)
  if (fileError) return fileError

  const id = args.id as string
  const todo = requireTodo(store, id)
  if (typeof todo === 'string') return todo

  store.deleteTodo(id)
  return getTodos(store)
}

function clearCompleted(store: Store): string {
  const fileError = requireFile(store)
  if (fileError) return fileError

  store.clearCompleted()
  return getTodos(store)
}
