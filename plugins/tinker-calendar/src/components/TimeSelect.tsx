import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import { ChevronDown } from 'lucide-react'

interface TimeSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const generateTimeOptions = () => {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      options.push(`${h}:${m}`)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

const TimeSelect = observer(
  ({ value, onChange, disabled = false }: TimeSelectProps) => {
    return (
      <div className="relative flex-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-8 border ${tw.border.both} rounded ${tw.bg.both.input} text-gray-800 dark:text-gray-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0fc25e] disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${tw.text.both.secondary}`}
        />
      </div>
    )
  }
)

export default TimeSelect
