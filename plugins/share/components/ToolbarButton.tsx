import { ReactNode, ButtonHTMLAttributes } from 'react'

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
      ? 'bg-[#0fc25e] text-white hover:bg-[#0db054]'
      : 'hover:bg-gray-200 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed'

  return (
    <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
