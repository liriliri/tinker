import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Checkbox from 'share/components/Checkbox'
import TextInput from 'share/components/TextInput'
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
          <div>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('eventTitlePlaceholder')}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${tw.text.secondary} w-12`}>
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
              <span className={`text-sm font-medium ${tw.text.secondary} w-12`}>
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

          <div className="pt-2">
            <Checkbox checked={isAllDay} onChange={setIsAllDay}>
              {t('allDay')}
            </Checkbox>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <DialogButton variant="text" onClick={onClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleSave} disabled={!title.trim()}>
            {t('save')}
          </DialogButton>
        </div>
      </Dialog>
    )
  }
)

export default EventDialog
