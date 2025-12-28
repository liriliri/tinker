import { Checkbox as HeadlessCheckbox } from '@headlessui/react'
import { Check } from 'lucide-react'
import { ReactNode } from 'react'
import { tw } from '../theme'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children?: ReactNode
  className?: string
  disabled?: boolean
}

export default function Checkbox({
  checked,
  onChange,
  children,
  className = '',
  disabled = false,
}: CheckboxProps) {
  return (
    <HeadlessCheckbox
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`group flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <div className={`flex h-4 w-4 items-center justify-center rounded border border-gray-400 dark:border-gray-500 ${tw.bg.light.primary} dark:bg-[#3c3c3c] group-data-[checked]:${tw.primary.bg} group-data-[checked]:${tw.primary.border} transition-colors group-data-[disabled]:opacity-50`}>
        <Check
          size={12}
          strokeWidth={3}
          className="text-white opacity-0 group-data-[checked]:opacity-100 transition-opacity"
        />
      </div>
      {children && <span>{children}</span>}
    </HeadlessCheckbox>
  )
}
