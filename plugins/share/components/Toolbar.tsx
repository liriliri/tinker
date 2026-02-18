import React, {
  ButtonHTMLAttributes,
  ReactNode,
  useRef,
  MouseEvent,
} from 'react'
import type { MenuItemConstructorOptions } from 'electron'
import { tw } from '../theme'

interface ToolbarProps {
  children: ReactNode
  className?: string
}

export function Toolbar({ children, className = '' }: ToolbarProps) {
  const baseClass = `${tw.bg.secondary} border-b ${tw.border.both} ${tw.text.dark.primary} px-1.5 py-1.5 flex gap-1 items-center`

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'action' | 'toggle'
  active?: boolean
  menu?: MenuItemConstructorOptions[]
  longPressDuration?: number
}

export function ToolbarButton({
  children,
  variant = 'action',
  active = false,
  className = '',
  menu,
  longPressDuration = 500,
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onContextMenu,
  ...props
}: ToolbarButtonProps) {
  const baseClass = 'p-1.5 rounded transition-colors'
  const longPressTimerRef = useRef<number | null>(null)
  const isLongPressRef = useRef(false)

  const variantClass =
    variant === 'toggle' && active
      ? `${tw.primary.bg} text-white ${tw.primary.bgHover}`
      : `${tw.hover.both} disabled:opacity-30 disabled:cursor-not-allowed`

  const showContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (!menu || menu.length === 0) return
    tinker.showContextMenu(event.clientX, event.clientY, menu)
  }

  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    if (menu && event.button === 0) {
      isLongPressRef.current = false
      longPressTimerRef.current = window.setTimeout(() => {
        isLongPressRef.current = true
        showContextMenu(event)
      }, longPressDuration)
    }
    onMouseDown?.(event)
  }

  const handleMouseUp = (event: MouseEvent<HTMLButtonElement>) => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    onMouseUp?.(event)
  }

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    onMouseLeave?.(event)
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (menu && isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }
    isLongPressRef.current = false
    onClick?.(event)
  }

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (menu) {
      event.preventDefault()
      showContextMenu(event)
    }
    onContextMenu?.(event)
  }

  return (
    <button
      className={`${baseClass} ${variantClass} ${className} ${
        menu ? 'relative' : ''
      }`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      {...props}
    >
      {children}
      {menu && (
        <svg
          className="absolute bottom-0.5 right-0.5 pointer-events-none"
          width="5"
          height="5"
          viewBox="0 0 5 5"
        >
          <path
            d="M 1 5 L 5 5 L 5 1"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
        </svg>
      )}
    </button>
  )
}

interface ToolbarTextButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function ToolbarTextButton({
  children,
  className = '',
  ...props
}: ToolbarTextButtonProps) {
  const baseClass = `px-3 py-1 text-xs rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:bg-[#8a8a8a] disabled:cursor-not-allowed`

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  )
}

interface ToolbarButtonGroupProps {
  children: ReactNode
  className?: string
}

export function ToolbarButtonGroup({
  children,
  className = '',
}: ToolbarButtonGroupProps) {
  const baseClass = `flex items-center overflow-hidden rounded border -my-px ${tw.border.both} ${tw.bg.secondary}`

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

export function ToolbarSeparator() {
  return <div className={`w-px h-5 ${tw.border.bg} mx-1`} />
}

export function ToolbarSpacer() {
  return <div className="flex-1" />
}

const toolbarTextInputClassName = `w-32 px-2 py-1 text-xs rounded border ${tw.border.both} ${tw.bg.input} ${tw.text.both.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`

export type ToolbarTextInputProps = React.InputHTMLAttributes<HTMLInputElement>

export function ToolbarTextInput({
  className = '',
  type = 'text',
  ...rest
}: ToolbarTextInputProps) {
  const combinedClassName = `${toolbarTextInputClassName} ${className}`.trim()

  return <input type={type} className={combinedClassName} {...rest} />
}

export const TOOLBAR_ICON_SIZE = 14

const toolbarLabelClassName = `text-xs ${tw.text.both.secondary} whitespace-nowrap`

export type ToolbarLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export function ToolbarLabel({ className = '', ...rest }: ToolbarLabelProps) {
  const combinedClassName = `${toolbarLabelClassName} ${className}`.trim()

  return <label className={combinedClassName} {...rest} />
}

const toolbarColorWrapClassName = `relative h-4 w-4 rounded overflow-hidden ${tw.border.both} border`
const toolbarColorSwatchClassName = `h-full w-full ${tw.bg.primary}`
const toolbarColorInputClassName = 'absolute inset-0 opacity-0 cursor-pointer'

export type ToolbarColorProps = React.InputHTMLAttributes<HTMLInputElement>

export function ToolbarColor({
  className = '',
  type = 'color',
  value,
  disabled,
  ...rest
}: ToolbarColorProps) {
  const wrapDisabledClass = disabled ? 'opacity-50 cursor-not-allowed' : ''
  const inputDisabledClass = disabled ? 'cursor-not-allowed' : ''

  const wrapClassName =
    `${toolbarColorWrapClassName} ${wrapDisabledClass} ${className}`.trim()
  const inputClassName =
    `${toolbarColorInputClassName} ${inputDisabledClass}`.trim()

  return (
    <div className={wrapClassName}>
      <div
        className={toolbarColorSwatchClassName}
        style={
          typeof value === 'string' ? { backgroundColor: value } : undefined
        }
      />
      <input
        type={type}
        value={value}
        disabled={disabled}
        className={inputClassName}
        {...rest}
      />
    </div>
  )
}
