import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Dialog, { DialogButton } from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store from '../store'
import { type Priority, type TodoItem } from '../types'

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

interface EditTodoProps {
  todo: TodoItem
  onClose: () => void
}

export default function EditTodo({ todo, onClose }: EditTodoProps) {
  const { t } = useTranslation()
  const [text, setText] = useState(todo.text)
  const [priority, setPriority] = useState<Priority>(todo.priority)
  const [dueDate, setDueDate] = useState(todo.dueDate || '')

  const handleSave = () => {
    if (!text.trim()) return
    store.updateTodo(todo.id, text.trim(), priority, dueDate || undefined)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  const handleClearDate = () => {
    setDueDate('')
  }

  return (
    <Dialog open={true} onClose={onClose} title={t('editTodo')}>
      <div className="flex flex-col gap-3">
        <TextInput
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('taskPlaceholder')}
          className={`w-full h-9 text-sm ${tw.primary.focusRing} focus:ring-2`}
          autoFocus
        />

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
              className={`absolute right-1 top-1/2 -translate-y-1/2 ${tw.text.tertiary} ${tw.hover} rounded p-0.5`}
              title={t('clearDate')}
            >
              <X size={12} />
            </button>
          </div>
          <div
            className={`flex gap-0.5 ${tw.bg.input} ${tw.border} border rounded-md p-0.5`}
          >
            {PRIORITIES.map((p) => {
              const isSelected = priority === p.value
              const colors = PRIORITY_COLORS[p.value || 'null']
              return (
                <button
                  key={p.value || 'none'}
                  onClick={() => setPriority(p.value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    isSelected
                      ? `${colors.bg} text-white`
                      : `${tw.text.secondary} ${tw.hover}`
                  }`}
                  title={t(p.labelKey)}
                >
                  {t(p.labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <DialogButton variant="text" onClick={onClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleSave} disabled={!text.trim()}>
            {t('save')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
}
