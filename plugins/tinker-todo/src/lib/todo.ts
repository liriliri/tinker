import { Item } from 'jstodotxt'
import find from 'licia/find'
import trim from 'licia/trim'
import { type Priority, type TodoItem } from '../types'

export function getLocalDateStr(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseTodoItem(raw: string, id?: string): TodoItem {
  const item = new Item(raw)

  let text = item.body() || ''
  text = trim(text.replace(/\s+due:\S+/g, ''))

  const createdDate = item.created()
  const completedDate = item.completed()

  return {
    id: id || Date.now().toString() + Math.random().toString(36).slice(2, 11),
    text,
    completed: item.complete() || false,
    priority: item.priority() as Priority,
    dueDate: extractDueDate(item),
    createdDate: createdDate ? getLocalDateStr(createdDate) : null,
    completedDate: completedDate ? getLocalDateStr(completedDate) : null,
    raw: item.toString(),
  }
}

interface Extension {
  key: string
  value: string
}

function extractDueDate(item: Item): string | null {
  const extensions = item.extensions() as Extension[] | null
  if (!extensions) return null
  const dueExt = find(extensions, (ext) => ext.key === 'due')
  return dueExt ? dueExt.value : null
}

export function createRawTodo(
  text: string,
  priority: Priority,
  dueDate?: string
): string {
  let raw = ''

  const today = getLocalDateStr()

  if (priority) {
    raw += `(${priority}) `
  }

  raw += `${today} ${text}`

  if (dueDate) {
    raw += ` due:${dueDate}`
  }

  return raw
}
