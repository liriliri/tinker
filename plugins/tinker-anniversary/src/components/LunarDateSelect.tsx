import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import type { SelectOption } from 'share/components/Select'
import { LUNAR_DAYS, LUNAR_MONTHS } from '../lib/lunar'

interface LunarDateSelectProps {
  month: number
  day: number
  onMonthChange: (month: number) => void
  onDayChange: (day: number) => void
}

export default observer(function LunarDateSelect({
  month,
  day,
  onMonthChange,
  onDayChange,
}: LunarDateSelectProps) {
  const { t } = useTranslation()

  const monthOptions = useMemo<SelectOption<number>[]>(
    () =>
      LUNAR_MONTHS.map((label, index) => ({
        value: index + 1,
        label,
      })),
    []
  )

  const dayOptions = useMemo<SelectOption<number>[]>(
    () =>
      LUNAR_DAYS.map((label, index) => ({
        value: index + 1,
        label,
      })),
    []
  )

  return (
    <div className="flex items-center gap-2 flex-1">
      <Select
        value={month}
        onChange={onMonthChange}
        options={monthOptions}
        className="flex-1"
      />
      <Select
        value={day}
        onChange={onDayChange}
        options={dayOptions}
        className="w-24"
        title={t('lunarDay')}
      />
    </div>
  )
})
