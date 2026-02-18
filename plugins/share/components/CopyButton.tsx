import { ButtonHTMLAttributes } from 'react'
import { Copy, Check } from 'lucide-react'
import { tw } from '../theme'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { TOOLBAR_ICON_SIZE } from './Toolbar'

interface CopyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string
  size?: number
  iconClassName?: string
  variant?: 'default' | 'icon' | 'toolbar'
}

export default function CopyButton({
  text,
  size,
  iconClassName = '',
  className = '',
  title,
  onClick,
  variant = 'default',
  ...props
}: CopyButtonProps) {
  const { copied, copyToClipboard } = useCopyToClipboard()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    copyToClipboard(text)
    onClick?.(e)
  }

  // Determine icon size based on variant
  const iconSize = size ?? (variant === 'toolbar' ? TOOLBAR_ICON_SIZE : 16)

  // Determine base class based on variant
  let baseClass = ''
  if (variant === 'icon') {
    baseClass = 'flex items-center justify-center'
  } else if (variant === 'toolbar') {
    baseClass = `p-1.5 rounded transition-colors ${tw.hover} disabled:opacity-30 disabled:cursor-not-allowed`
  } else {
    // default variant
    baseClass = `flex-shrink-0 px-3 py-2 rounded ${tw.bg.secondary} ${tw.hover}`
  }

  // Apply primary color to button when copied (for toolbar variant)
  const buttonColorClass =
    variant === 'toolbar' && copied ? tw.primary.text : ''

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`${baseClass} ${buttonColorClass} ${className}`}
      title={title}
    >
      {copied ? (
        <Check size={iconSize} className={tw.primary.text} />
      ) : (
        <Copy size={iconSize} className={iconClassName} />
      )}
    </button>
  )
}
