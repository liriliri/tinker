import { ReactNode } from 'react'
import { tw } from '../theme'

interface StatusBarProps {
  children: ReactNode
  className?: string
}

export function StatusBar({ children, className = '' }: StatusBarProps) {
  const baseClass = `flex items-center h-[22px] text-xs ${tw.text.secondary} ${tw.bg.secondary} border-t ${tw.border} shrink-0`

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

interface StatusBarItemProps {
  children: ReactNode
  className?: string
  clickable?: boolean
  onClick?: () => void
}

export function StatusBarItem({
  children,
  className = '',
  clickable = true,
  onClick,
}: StatusBarItemProps) {
  const interactiveClass = clickable
    ? `${tw.hover} active:opacity-70 cursor-pointer`
    : ''

  return (
    <span
      className={`shrink-0 h-full flex items-center px-1.5 ${interactiveClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </span>
  )
}

export function StatusBarSpacer() {
  return <div className="flex-1" />
}
