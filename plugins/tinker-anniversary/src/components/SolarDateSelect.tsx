import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import contain from 'licia/contain'
import map from 'licia/map'
import range from 'licia/range'
import Select from 'share/components/Select'
import type { SelectOption } from 'share/components/Select'

interface SolarDateSelectProps {
  month: number
  day: number
  onMonthChange: (month: number) => void
  onDayChange: (day: number) => void
}

function getDaysInMonth(month: number): number {
  if (month === 2) return 29
  if (contain([4, 6, 9, 11], month)) return 30
  return 31
}

export default observer(function SolarDateSelect({
  month,
  day,
  onMonthChange,
  onDayChange,
}: SolarDateSelectProps) {
  const { i18n } = useTranslation()

  const monthOptions = useMemo<SelectOption<number>[]>(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, {
      month: 'long',
    })
    return map(range(1, 13), (value) => ({
      value,
      label: formatter.format(new Date(2024, value - 1, 1)),
    }))
  }, [i18n.language])

  const dayOptions = useMemo<SelectOption<number>[]>(() => {
    const maxDay = getDaysInMonth(month)
    return map(range(1, maxDay + 1), (value) => ({
      value,
      label: String(value),
    }))
  }, [month])

  const handleMonthChange = (value: number) => {
    onMonthChange(value)
    const maxDay = getDaysInMonth(value)
    if (day > maxDay) {
      onDayChange(maxDay)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-1">
      <Select
        value={month}
        onChange={handleMonthChange}
        options={monthOptions}
        className="flex-1"
      />
      <Select
        value={day}
        onChange={onDayChange}
        options={dayOptions}
        className="w-20"
      />
    </div>
  )
})
