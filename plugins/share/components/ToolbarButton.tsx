import { ReactNode, ButtonHTMLAttributes } from 'react'
import { tw } from '../theme'

interface ToolbarButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'action' | 'toggle'
  active?: boolean
}

export function ToolbarButton({
  children,
  variant = 'action',
  active = false,
  className = '',
  ...props
}: ToolbarButtonProps) {
  const baseClass = 'p-1.5 rounded transition-colors'

  const variantClass =
    variant === 'toggle' && active
      ? `${tw.primary.bg} text-white ${tw.primary.bgHover}`
      : `${tw.hover.both} disabled:opacity-30 disabled:cursor-not-allowed`

  return (
    <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
