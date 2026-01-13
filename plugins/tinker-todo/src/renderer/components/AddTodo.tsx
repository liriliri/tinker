import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Plus, Flag, Calendar } from 'lucide-react'
import store, { Priority } from '../store'
import { tw } from 'share/theme'

export default observer(function AddTodo() {
  const { t } = useTranslation()
  const [dueDate, setDueDate] = useState('')

  const handleAdd = () => {
    store.addTodo(dueDate || undefined)
    setDueDate('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  const priorities: {
    value: Priority
    label: string
    colorLight: string
    colorDark: string
  }[] = [
    {
      value: null,
      label: t('noPriority'),
      colorLight: 'bg-gray-500',
      colorDark: 'dark:bg-gray-500',
    },
    {
      value: 'C',
      label: t('lowPriority'),
      colorLight: 'bg-blue-500',
      colorDark: 'dark:bg-blue-500',
    },
    {
      value: 'B',
      label: t('mediumPriority'),
      colorLight: 'bg-yellow-500',
      colorDark: 'dark:bg-yellow-500',
    },
    {
      value: 'A',
      label: t('highPriority'),
      colorLight: 'bg-red-500',
      colorDark: 'dark:bg-red-500',
    },
  ]

  return (
    <div className={`${tw.bg.secondary} ${tw.border.bottom} p-4 flex-shrink-0`}>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={store.newTodoText}
          onChange={(e) => store.setNewTodoText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('taskPlaceholder')}
          className={`flex-1 h-9 px-3 ${tw.bg.input} border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
        />

        <button
          onClick={handleAdd}
          className={`h-9 px-4 ${tw.primary.bg} ${tw.primary.textOnBg} rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5`}
        >
          <Plus size={16} />
          {t('addTask')}
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className={tw.text.secondary} />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`h-7 px-2 ${tw.bg.input} border-0 rounded text-xs focus:outline-none focus:ring-2 focus:ring-ring`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Flag size={14} className={tw.text.secondary} />
          <div className={`flex gap-0.5 ${tw.bg.input} rounded-md p-0.5`}>
            {priorities.map((priority) => (
              <button
                key={priority.value || 'none'}
                onClick={() => store.setNewTodoPriority(priority.value)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  store.newTodoPriority === priority.value
                    ? `${priority.colorLight} ${priority.colorDark} text-white`
                    : `${tw.text.secondary} hover:${tw.text.primary}`
                }`}
                title={priority.label}
              >
                {priority.value || '-'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
