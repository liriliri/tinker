import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store, { Priority } from '../store'

const PRIORITY_COLORS = {
  A: { bg: 'bg-red-500', hover: 'hover:bg-red-600' },
  B: { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
  C: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
  null: { bg: 'bg-gray-500', hover: 'hover:bg-gray-600' },
} as const

interface PriorityOption {
  value: Priority
  labelKey: string
}

const PRIORITIES: readonly PriorityOption[] = [
  { value: null, labelKey: 'noPriority' },
  { value: 'C', labelKey: 'lowPriority' },
  { value: 'B', labelKey: 'mediumPriority' },
  { value: 'A', labelKey: 'highPriority' },
] as const

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

  const handleClearDate = () => {
    setDueDate('')
  }

  return (
    <div
      className={`${tw.bg.both.tertiary} ${tw.border.both} border-b p-4 flex-shrink-0`}
    >
      <div className="flex gap-2 mb-2">
        <TextInput
          type="text"
          value={store.newTodoText}
          onChange={(e) => store.setNewTodoText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('taskPlaceholder')}
          className={`flex-1 h-9 text-sm ${tw.primary.focusRing} focus:ring-2`}
        />

        <button
          onClick={handleAdd}
          className={`h-9 px-4 ${tw.primary.bg} text-white rounded text-sm font-medium ${tw.primary.bgHover} transition-colors flex items-center gap-1.5`}
        >
          <Plus size={16} />
          {t('add')}
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative">
          <TextInput
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`w-auto h-7 px-2 pr-7 text-xs ${tw.primary.focusRing} focus:ring-2`}
          />
          <button
            onClick={handleClearDate}
            className={`absolute right-1 top-1/2 -translate-y-1/2 ${tw.text.both.tertiary} ${tw.hover.both} rounded p-0.5`}
            title={t('clearDate')}
          >
            <X size={12} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`flex gap-0.5 ${tw.bg.both.input} ${tw.border.both} border rounded-md p-0.5`}
          >
            {PRIORITIES.map((priority) => {
              const isSelected = store.newTodoPriority === priority.value
              const colors = PRIORITY_COLORS[priority.value || 'null']
              return (
                <button
                  key={priority.value || 'none'}
                  onClick={() => store.setNewTodoPriority(priority.value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isSelected
                      ? `${colors.bg} text-white`
                      : `${tw.text.both.secondary} ${tw.hover.both}`
                  }`}
                  title={t(priority.labelKey)}
                >
                  {t(priority.labelKey)}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
})
