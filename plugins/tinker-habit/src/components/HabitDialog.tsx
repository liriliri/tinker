import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import contain from 'licia/contain'
import filter from 'licia/filter'
import map from 'licia/map'
import sortBy from 'licia/sortBy'
import trim from 'licia/trim'
import className from 'licia/className'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import { defaultHabitForm, HABIT_COLORS, WEEKDAY_ORDER } from '../lib/habit'
import type { Habit, HabitFormData, ScheduleType } from '../types'

interface HabitDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: HabitFormData) => void
  habit?: Habit | null
}

export default observer(function HabitDialog({
  isOpen,
  onClose,
  onSave,
  habit,
}: HabitDialogProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<HabitFormData>(defaultHabitForm())

  useEffect(() => {
    if (!isOpen) return
    if (habit) {
      setForm({
        title: habit.title,
        color: habit.color,
        scheduleType: habit.scheduleType,
        weekdays: [...habit.weekdays],
        weeklyTarget: habit.weeklyTarget,
        monthlyTarget: habit.monthlyTarget,
      })
    } else {
      setForm(defaultHabitForm())
    }
  }, [isOpen, habit])

  const scheduleOptions = useMemo(
    () => [
      { label: t('scheduleWeekdays'), value: 'weekdays' as const },
      { label: t('scheduleWeekly'), value: 'weekly' as const },
      { label: t('scheduleMonthly'), value: 'monthly' as const },
    ],
    [t]
  )

  const weekdayLabels = useMemo(
    () => ({
      0: t('sun'),
      1: t('mon'),
      2: t('tue'),
      3: t('wed'),
      4: t('thu'),
      5: t('fri'),
      6: t('sat'),
    }),
    [t]
  )

  const handleSave = () => {
    if (isStrBlank(form.title)) return
    if (form.scheduleType === 'weekdays' && form.weekdays.length === 0) return
    onSave({
      ...form,
      title: trim(form.title),
    })
  }

  const toggleWeekday = (day: number) => {
    setForm((prev) => {
      const exists = contain(prev.weekdays, day)
      return {
        ...prev,
        weekdays: exists
          ? filter(prev.weekdays, (item) => item !== day)
          : sortBy([...prev.weekdays, day]),
      }
    })
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={habit ? t('editHabitTitle') : t('newHabitTitle')}
      showClose
    >
      <div className="flex flex-col gap-3 mt-3 min-w-[320px]">
        <div className="flex flex-col gap-1">
          <label className={`text-xs ${tw.text.secondary}`}>
            {t('habitTitle')}
          </label>
          <TextInput
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder={t('habitTitlePlaceholder')}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs ${tw.text.secondary}`}>
            {t('habitColor')}
          </label>
          <div className="flex flex-wrap gap-2">
            {map(HABIT_COLORS, (color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color }))}
                className={className(
                  'w-6 h-6 rounded-full border-2 transition-transform',
                  form.color === color
                    ? `scale-110 ${tw.primary.border}`
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs ${tw.text.secondary}`}>
            {t('scheduleType')}
          </label>
          <Select
            className="w-full"
            value={form.scheduleType}
            options={scheduleOptions}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                scheduleType: value as ScheduleType,
              }))
            }
          />
        </div>

        <div className="flex flex-col gap-1 min-h-[58px]">
          {form.scheduleType === 'weekdays' && (
            <>
              <label className={`text-xs ${tw.text.secondary}`}>
                {t('weekdays')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {map(WEEKDAY_ORDER, (day) => {
                  const active = contain(form.weekdays, day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={className(
                        'px-2.5 py-1 text-xs rounded border transition-colors',
                        tw.border,
                        active
                          ? `${tw.primary.bg} text-white`
                          : `${tw.bg.primary} ${tw.text.primary} ${tw.hover}`
                      )}
                    >
                      {weekdayLabels[day as keyof typeof weekdayLabels]}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {form.scheduleType === 'weekly' && (
            <>
              <label className={`text-xs ${tw.text.secondary}`}>
                {t('weeklyTarget')}
              </label>
              <TextInput
                type="number"
                min={1}
                max={7}
                value={form.weeklyTarget}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    weeklyTarget: Number(e.target.value) || 1,
                  }))
                }
              />
            </>
          )}

          {form.scheduleType === 'monthly' && (
            <>
              <label className={`text-xs ${tw.text.secondary}`}>
                {t('monthlyTarget')}
              </label>
              <TextInput
                type="number"
                min={1}
                max={31}
                value={form.monthlyTarget}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    monthlyTarget: Number(e.target.value) || 1,
                  }))
                }
              />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <DialogButton variant="text" onClick={onClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleSave}>{t('save')}</DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
