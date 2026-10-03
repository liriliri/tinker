import React from 'react'
import { FolderOpen, X } from 'lucide-react'
import { tw } from '../theme'

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  onBrowse: () => void
  onClear?: () => void
  className?: string
  inputClassName?: string
}

export default function FileInput({
  onBrowse,
  onClear,
  className = '',
  inputClassName = '',
  ...rest
}: FileInputProps) {
  const hasValue = !!rest.value

  return (
    <div
      className={`flex items-center rounded ${tw.bg.input} ${tw.border} border overflow-hidden ${className}`}
    >
      <input
        type="text"
        className={`flex-1 min-w-0 py-1.5 px-3 text-sm outline-none bg-transparent ${tw.text.primary} ${inputClassName}`}
        {...rest}
      />
      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          className={`self-stretch flex items-center justify-center px-1.5 cursor-pointer transition-colors ${tw.text.secondary} ${tw.hover}`}
        >
          <X size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onBrowse}
        className={`self-stretch flex items-center justify-center px-2 cursor-pointer transition-colors ${tw.text.secondary} ${tw.hover}`}
      >
        <FolderOpen size={16} />
      </button>
    </div>
  )
}
