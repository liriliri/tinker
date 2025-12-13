import React from 'react'

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
    // Try to parse as number if the original value type is number
    const parsedValue =
      typeof options[0]?.value === 'number'
        ? (Number(selectedValue) as T)
        : (selectedValue as T)
    onChange(parsedValue)
  }

  return (
    <select
      value={String(value)}
      onChange={handleChange}
      disabled={disabled}
      className={`text-xs px-2 py-1 bg-white dark:bg-[#3e3e42] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded cursor-pointer focus:outline-none focus:border-[#0fc25e] dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
