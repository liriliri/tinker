import React from 'react'
import { ChevronDown } from 'lucide-react'
import { tw } from '../theme'

export interface SelectOption<T = string> {
  label: string
  value: T
}

export interface SelectProps<T = string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  disabled?: boolean
  className?: string
  title?: string
}

export default function Select<T extends string | number = string>({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  title,
}: SelectProps<T>) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    // Find the matching option and use its original value
    const matchedOption = options.find(
      (opt) => String(opt.value) === selectedValue
    )
    if (matchedOption) {
      onChange(matchedOption.value)
    }
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={String(value)}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full h-full appearance-none text-xs pl-2 pr-6 py-1 ${tw.bg.select} border ${tw.gray.border600} rounded cursor-pointer focus:outline-none ${tw.primary.focusBorder} ${tw.text.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
        title={title}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className={`pointer-events-none absolute right-1.5 ${tw.text.secondary}`}
      />
    </div>
  )
}
