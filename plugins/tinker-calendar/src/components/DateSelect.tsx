import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'

interface DateSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const DateSelect = observer(
  ({ value, onChange, disabled = false }: DateSelectProps) => {
    return (
      <div className="relative flex-1">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border ${tw.border} rounded ${tw.bg.input} text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 ${tw.primary.focusRing} cursor-pointer [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>
    )
  }
)

export default DateSelect
