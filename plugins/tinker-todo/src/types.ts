export type Priority = 'A' | 'B' | 'C' | null
export type FilterType = 'all' | 'today' | 'important' | 'completed'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: Priority
  dueDate: string | null
  createdDate: string | null
  completedDate: string | null
  raw: string
}
