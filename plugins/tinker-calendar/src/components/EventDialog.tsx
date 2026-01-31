import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Dialog from 'share/components/Dialog'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import TimeSelect from './TimeSelect'
import DateSelect from './DateSelect'

interface EventDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: EventFormData) => void
  initialDate: string
  initialTitle?: string
  initialStartTime?: string
  initialEndTime?: string
  initialEndDate?: string
}

export interface EventFormData {
  title: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  isAllDay: boolean
}

const EventDialog = observer(
  ({
    isOpen,
    onClose,
    onSave,
    initialDate,
    initialTitle = '',
    initialStartTime = '09:00',
    initialEndTime = '10:00',
    initialEndDate,
  }: EventDialogProps) => {
    const { t } = useTranslation()
    const [title, setTitle] = useState(initialTitle)
    const [startDate, setStartDate] = useState(initialDate)
    const [endDate, setEndDate] = useState(initialEndDate || initialDate)
    const [startTime, setStartTime] = useState(initialStartTime)
    const [endTime, setEndTime] = useState(initialEndTime)
    const [isAllDay, setIsAllDay] = useState(true)

    useEffect(() => {
      if (isOpen) {
        setTitle(initialTitle)
        setStartDate(initialDate)
        setEndDate(initialEndDate || initialDate)
        setStartTime(initialStartTime)
        setEndTime(initialEndTime)
        setIsAllDay(!initialStartTime)
      }
    }, [
      isOpen,
      initialDate,
      initialTitle,
      initialStartTime,
      initialEndTime,
      initialEndDate,
    ])

    const handleSave = () => {
      if (!title.trim()) return

      onSave({
        title: title.trim(),
        startDate,
        endDate,
        startTime,
        endTime,
        isAllDay,
      })
      onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    }

    return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        title={initialTitle ? t('editEventTitle') : t('newEventTitle')}
        className="w-full max-w-lg"
      >
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('eventTitlePlaceholder')}
              autoFocus
              className={`w-full px-3 py-2 border ${tw.border.both} rounded ${tw.bg.both.tertiary} text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0fc25e]`}
            />
          </div>

          {/* Time Selects */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                {t('startTime')}
              </span>
              <DateSelect
                value={startDate}
                onChange={setStartDate}
                disabled={isAllDay}
              />
              <TimeSelect
                value={startTime}
                onChange={setStartTime}
                disabled={isAllDay}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                {t('endTime')}
              </span>
              <DateSelect
                value={endDate}
                onChange={setEndDate}
                disabled={isAllDay}
              />
              <TimeSelect
                value={endTime}
                onChange={setEndTime}
                disabled={isAllDay}
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="pt-2">
            <Checkbox checked={isAllDay} onChange={setIsAllDay}>
              {t('allDay')}
            </Checkbox>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className={`px-4 py-2 text-sm ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t('save')}
          </button>
        </div>
      </Dialog>
    )
  }
)

export default EventDialog
