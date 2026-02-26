import { Item } from 'jstodotxt'
import { type Priority, type TodoItem } from '../types'

export function parseTodoItem(raw: string, id?: string): TodoItem {
  const item = new Item(raw)

  let text = item.body() || ''
  text = text.replace(/\s+due:\S+/g, '').trim()

  const createdDate = item.created()
  const completedDate = item.completed()

  return {
    id: id || Date.now().toString() + Math.random().toString(36).slice(2, 11),
    text,
    completed: item.complete() || false,
    priority: item.priority() as Priority,
    dueDate: extractDueDate(item),
    createdDate: createdDate ? createdDate.toISOString().split('T')[0] : null,
    completedDate: completedDate
      ? completedDate.toISOString().split('T')[0]
      : null,
    raw: item.toString(),
  }
}

function extractDueDate(item: Item): string | null {
  const extensions = item.extensions()
  if (!extensions) return null
  const dueExt = extensions.find((ext: any) => ext.key === 'due')
  return dueExt ? dueExt.value : null
}

export function createRawTodo(
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
