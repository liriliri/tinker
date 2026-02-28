import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Check, Calendar } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import className from 'licia/className'
import store from '../store'
import { type TodoItem as TodoItemType } from '../types'
import { tw } from 'share/theme'
import EditTodo from './EditTodo'

interface TodoItemProps {
  todo: TodoItemType
}

const PRIORITY_STYLES: Record<
  string,
  {
    bg: string
    text: string
    labelKey: string
  }
> = {
  A: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-500',
    labelKey: 'highPriority',
  },
  B: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    text: 'text-yellow-500',
    labelKey: 'mediumPriority',
  },
  C: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-500',
    labelKey: 'lowPriority',
  },
  null: {
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    text: 'text-gray-500',
    labelKey: 'noPriority',
  },
}

export default observer(function TodoItem({ todo }: TodoItemProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('deleteConfirm'),
    })
    if (confirmed) {
      store.deleteTodo(todo.id)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      { label: t('edit'), click: () => setIsEditing(true) },
      { label: t('delete'), click: handleDelete },
    ])
  }

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateToCheck = new Date(date)
    dateToCheck.setHours(0, 0, 0, 0)

    if (dateToCheck.getTime() === today.getTime()) return t('today')
    if (dateToCheck.getTime() === tomorrow.getTime()) return t('tomorrow')

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateToCheck.getTime() === yesterday.getTime()) return t('yesterday')

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const priorityStyle = PRIORITY_STYLES[todo.priority || 'null']

  return (
    <div
      className={className(
        'group border rounded-lg p-2 transition-all duration-200 hover:shadow-sm',
        tw.bg.tertiary,
        tw.border,
        todo.completed && 'opacity-60'
      )}
      onContextMenu={handleContextMenu}
    >
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => store.toggleTodo(todo.id)}
          className={className(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
            todo.completed
              ? [tw.primary.bg, tw.primary.border]
              : [tw.border, tw.primary.hoverBorder]
          )}
        >
          {todo.completed && <Check size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={className(
                'flex-1 text-sm font-medium',
                todo.completed
                  ? ['line-through', tw.text.secondary]
                  : tw.text.primary
              )}
            >
              {todo.text}
            </h3>

            {todo.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs ${tw.text.secondary}`}
              >
                <Calendar size={12} />
                <span>{formatDate(todo.dueDate)}</span>
              </div>
            )}

            {todo.priority && (
              <div
                className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
              >
                {t(priorityStyle.labelKey)}
              </div>
            )}
          </div>
        </div>
      </div>
      {isEditing && (
        <EditTodo todo={todo} onClose={() => setIsEditing(false)} />
      )}
    </div>
  )
})
