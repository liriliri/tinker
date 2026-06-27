import React from 'react'
import { FolderOpen } from 'lucide-react'
import { tw } from '../theme'

export interface FileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  onBrowse: () => void
  className?: string
  inputClassName?: string
}

export default function FileInput({
  onBrowse,
  className = '',
  inputClassName = '',
  ...rest
}: FileInputProps) {
  return (
    <div
      className={`flex items-center rounded ${tw.bg.input} ${tw.border} border overflow-hidden ${className}`}
    >
      <input
        type="text"
        className={`flex-1 py-1.5 px-3 text-sm outline-none bg-transparent ${tw.text.primary} ${inputClassName}`}
        {...rest}
      />
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
