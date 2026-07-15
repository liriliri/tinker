import { ChevronDown } from 'lucide-react'
import className from 'licia/className'
import { tw } from '../../theme'

export interface ModelSelectOption {
  label: string
  value: string
}

export interface ModelSelectProps {
  value: string
  onChange: (value: string) => void
  options: ModelSelectOption[]
  disabled?: boolean
}

export default function ModelSelect({
  value,
  onChange,
  options,
  disabled = false,
}: ModelSelectProps) {
  const label = options.find((opt) => opt.value === value)?.label ?? ''

  return (
    <div
      className={className(
        'relative inline-flex max-w-[280px] items-center rounded-sm',
        !disabled && tw.hover
      )}
    >
      <div
        className={className(
          'pointer-events-none flex h-8 max-w-full items-center gap-1 px-2 text-xs font-medium',
          tw.text.secondary
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown size={12} className="size-3 shrink-0" />
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={className(
          'absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0',
          'disabled:cursor-not-allowed'
        )}
        title={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
