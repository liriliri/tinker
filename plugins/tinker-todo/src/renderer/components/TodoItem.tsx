import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Check, Trash2, Calendar, Hash, AtSign } from 'lucide-react'
import store, { TodoItem as TodoItemType, Priority } from '../store'
import { tw } from 'share/theme'

interface TodoItemProps {
  todo: TodoItemType
}

const priorityColors: Record<
  Priority | 'null',
  { bg: string; text: string; label: string }
> = {
  A: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-500',
    label: 'High',
  },
  B: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    text: 'text-yellow-500',
    label: 'Med',
  },
  C: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-500',
    label: 'Low',
  },
  null: {
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    text: 'text-gray-500',
    label: 'None',
  },
}

export default observer(function TodoItem({ todo }: TodoItemProps) {
  const { t } = useTranslation()

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

  const priorityStyle = priorityColors[todo.priority || 'null']

  return (
    <div
      className={`group ${tw.bg.secondary} ${
        tw.border.both
      } rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${
        todo.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => store.toggleTodo(todo.id)}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center mt-0.5 ${
            todo.completed
              ? `${tw.primary.bg} ${tw.primary.border}`
              : `${tw.border.both} hover:${tw.primary.border}`
          }`}
        >
          {todo.completed && (
            <Check size={12} className={tw.primary.textOnBg} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3
              className={`flex-1 text-sm font-medium ${
                todo.completed
                  ? `line-through ${tw.text.secondary}`
                  : tw.text.primary
              }`}
            >
              {todo.text}
            </h3>

            {todo.priority && (
              <div
                className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${priorityStyle.bg} ${priorityStyle.text}`}
              >
                {priorityStyle.label}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            {todo.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs ${tw.text.secondary}`}
              >
                <Calendar size={12} />
                <span>{formatDate(todo.dueDate)}</span>
              </div>
            )}

            {todo.projects.length > 0 && (
              <div
                className={`flex items-center gap-1 text-xs ${tw.text.secondary}`}
              >
                <Hash size={12} />
                <span>{todo.projects.join(', ')}</span>
              </div>
            )}

            {todo.contexts.length > 0 && (
              <div
                className={`flex items-center gap-1 text-xs ${tw.text.secondary}`}
              >
                <AtSign size={12} />
                <span>{todo.contexts.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => store.deleteTodo(todo.id)}
            className={`p-1.5 ${tw.text.secondary} hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors`}
            title={t('delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
})
