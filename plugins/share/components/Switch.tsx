import { Switch as HeadlessSwitch } from '@headlessui/react'
import { tw } from '../theme'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  disabled?: boolean
  title?: string
}

export default function Switch({
  checked,
  onChange,
  className = '',
  disabled = false,
  title,
}: SwitchProps) {
  return (
    <HeadlessSwitch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      title={title}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? tw.primary.bg : 'bg-gray-300 dark:bg-gray-600'
      } ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </HeadlessSwitch>
  )
}
