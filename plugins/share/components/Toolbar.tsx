import { ReactNode } from 'react'

interface ToolbarProps {
  children: ReactNode
  className?: string
}

export function Toolbar({ children, className = '' }: ToolbarProps) {
  const baseClass =
    'bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center'

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

export function ToolbarSeparator() {
  return <div className="w-px h-5 bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />
}

export function ToolbarSpacer() {
  return <div className="flex-1" />
}

export const TOOLBAR_ICON_SIZE = 14
