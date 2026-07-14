import { useState, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import toInt from 'licia/toInt'
import trim from 'licia/trim'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import { solarToLunarParts } from '../lib/lunar'
import SolarDateSelect from './SolarDateSelect'
import LunarDateSelect from './LunarDateSelect'

interface AnniversaryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: AnniversaryFormData) => void
  initialDate: string
  initialTitle?: string
  initialIsLunar?: boolean
  initialMonth?: number
  initialDay?: number
  initialLunarMonth?: number
  initialLunarDay?: number
  initialStartYear?: number
}

export interface AnniversaryFormData {
  title: string
  isLunar: boolean
  month: number
  day: number
  lunarMonth: number
  lunarDay: number
  startYear?: number
}

function parseSolarFromDate(dateKey: string) {
  return {
    month: toInt(dateKey.slice(5, 7)),
    day: toInt(dateKey.slice(8, 10)),
  }
}

const AnniversaryDialog = observer(
  ({
    isOpen,
    onClose,
    onSave,
    initialDate,
    initialTitle = '',
    initialIsLunar = false,
    initialMonth,
    initialDay,
    initialLunarMonth,
    initialLunarDay,
    initialStartYear,
  }: AnniversaryDialogProps) => {
    const { t } = useTranslation()
    const solarFromDate = useMemo(
      () => parseSolarFromDate(initialDate),
      [initialDate]
    )
    const lunarFromDate = useMemo(() => {
      const parts = solarToLunarParts(new Date(`${initialDate}T00:00:00`))
      return parts || { month: 1, day: 1 }
    }, [initialDate])

    const [title, setTitle] = useState(initialTitle)
    const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>(
      initialIsLunar ? 'lunar' : 'solar'
    )
    const [month, setMonth] = useState(initialMonth ?? solarFromDate.month)
    const [day, setDay] = useState(initialDay ?? solarFromDate.day)
    const [lunarMonth, setLunarMonth] = useState(
      initialLunarMonth ?? lunarFromDate.month
    )
    const [lunarDay, setLunarDay] = useState(
      initialLunarDay ?? lunarFromDate.day
    )
    const [startYear, setStartYear] = useState(
      initialStartYear !== undefined ? String(initialStartYear) : ''
    )

    const calendarTypeOptions = useMemo(
      () => [
        { label: t('solarCalendar'), value: 'solar' as const },
        { label: t('lunarCalendar'), value: 'lunar' as const },
      ],
      [t]
    )

    useEffect(() => {
      if (!isOpen) return

      setTitle(initialTitle)
      setCalendarType(initialIsLunar ? 'lunar' : 'solar')
      setMonth(initialMonth ?? solarFromDate.month)
      setDay(initialDay ?? solarFromDate.day)
      setLunarMonth(initialLunarMonth ?? lunarFromDate.month)
      setLunarDay(initialLunarDay ?? lunarFromDate.day)
      setStartYear(
        initialStartYear !== undefined ? String(initialStartYear) : ''
      )
    }, [
      isOpen,
      initialTitle,
      initialIsLunar,
      initialMonth,
      initialDay,
      initialLunarMonth,
      initialLunarDay,
      initialStartYear,
      solarFromDate,
      lunarFromDate,
    ])

    const handleSave = () => {
      if (isStrBlank(title)) return

      const trimmedYear = trim(startYear)
      const parsedYear = trimmedYear ? parseInt(trimmedYear, 10) : undefined

      onSave({
        title: trim(title),
        isLunar: calendarType === 'lunar',
        month,
        day,
        lunarMonth,
        lunarDay,
        startYear:
          parsedYear !== undefined && !Number.isNaN(parsedYear)
            ? parsedYear
            : undefined,
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
        title={
          initialTitle ? t('editAnniversaryTitle') : t('newAnniversaryTitle')
        }
        showClose
        className="w-full max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('anniversaryTitlePlaceholder')}
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${tw.text.secondary} w-12`}>
              {t('calendarType')}
            </span>
            <Select
              value={calendarType}
              onChange={setCalendarType}
              options={calendarTypeOptions}
              className="flex-1"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${tw.text.secondary} w-12`}>
              {t('date')}
            </span>
            {calendarType === 'solar' ? (
              <SolarDateSelect
                month={month}
                day={day}
                onMonthChange={setMonth}
                onDayChange={setDay}
              />
            ) : (
              <LunarDateSelect
                month={lunarMonth}
                day={lunarDay}
                onMonthChange={setLunarMonth}
                onDayChange={setLunarDay}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${tw.text.secondary} w-12`}>
              {t('startYear')}
            </span>
            <TextInput
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder={t('startYearPlaceholder')}
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <DialogButton onClick={handleSave} disabled={isStrBlank(title)}>
            {t('save')}
          </DialogButton>
        </div>
      </Dialog>
    )
  }
)

export default AnniversaryDialog
