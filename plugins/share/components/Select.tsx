import React from 'react'
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
    <select
      value={String(value)}
      onChange={handleChange}
      disabled={disabled}
      className={`text-xs px-2 py-1 ${tw.bg.light.primary} ${tw.bg.dark.select} border border-[#d0d0d0] dark:border-[#555555] rounded cursor-pointer focus:outline-none ${tw.primary.focusBorder} ${tw.text.dark.primary} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={title}
    >
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
