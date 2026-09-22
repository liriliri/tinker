import { ReactNode } from 'react'
import { tw } from '../theme'

export interface RadioProps {
  checked: boolean
  onChange: () => void
  name?: string
  children?: ReactNode
  className?: string
  disabled?: boolean
}

export default function Radio({
  checked,
  onChange,
  name,
  children,
  className = '',
  disabled = false,
}: RadioProps) {
  return (
    <label
      className={`group inline-flex align-middle items-center gap-1.5 text-xs leading-none cursor-pointer hover:opacity-80 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
          checked
            ? `${tw.primary.bg} ${tw.primary.border}`
            : `border-gray-400 dark:border-gray-500 ${tw.bg.primary} ${tw.bg.select}`
        }`}
      >
        <div
          className={`h-1.5 w-1.5 rounded-full bg-white transition-opacity ${
            checked ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
      {children && <span>{children}</span>}
    </label>
  )
}
