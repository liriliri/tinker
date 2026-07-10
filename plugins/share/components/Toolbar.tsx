import React, {
  ButtonHTMLAttributes,
  ReactNode,
  useRef,
  useEffect,
  useState,
  MouseEvent,
} from 'react'
import { Search, X } from 'lucide-react'
import type { MenuItemConstructorOptions } from 'electron'
import { tw } from '../theme'

interface ToolbarProps {
  children: ReactNode
  className?: string
}

export function Toolbar({ children, className = '' }: ToolbarProps) {
  const baseClass = `${tw.bg.secondary} border-b ${tw.border} ${tw.text.primary} px-1.5 h-10 shrink-0 flex gap-1 items-center`

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
  const baseClass = 'p-1.5 rounded transition-colors text-xs'
  const longPressTimerRef = useRef<number | null>(null)
  const isLongPressRef = useRef(false)

  const variantClass =
    variant === 'toggle' && active
      ? `${tw.primary.bg} text-white ${tw.primary.bgHover}`
      : `${tw.hover} disabled:opacity-30 disabled:cursor-not-allowed`

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
    if (onClick) {
      onClick(event)
    } else if (menu) {
      showContextMenu(event)
    }
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
  variant?: 'primary' | 'secondary'
}

export function ToolbarTextButton({
  children,
  className = '',
  variant = 'primary',
  disabled,
  ...props
}: ToolbarTextButtonProps) {
  const effectiveVariant = disabled ? 'secondary' : variant
  const variantClass =
    effectiveVariant === 'secondary'
      ? `${tw.secondary.bg}`
      : `${tw.primary.bg} ${tw.primary.bgHover}`
  const baseClass = `px-3 py-1 text-xs rounded ${variantClass} text-white disabled:cursor-not-allowed`

  return (
    <button
      className={`${baseClass} ${className}`}
      disabled={disabled}
      {...props}
    >
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
  const baseClass = `flex items-center overflow-hidden rounded border -my-px h-7 ${tw.border} ${tw.bg.secondary}`

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

export function ToolbarSeparator() {
  return <div className={`w-px h-5 ${tw.bg.border} mx-1`} />
}

export function ToolbarSpacer() {
  return <div className="flex-1" />
}

const toolbarTextInputClassName = `w-32 px-2 py-1 text-xs rounded border ${tw.border} ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing} disabled:opacity-50 disabled:cursor-not-allowed`

export type ToolbarTextInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const ToolbarTextInput = React.forwardRef<
  HTMLInputElement,
  ToolbarTextInputProps
>(({ className = '', type = 'text', ...rest }, ref) => {
  const combinedClassName = `${toolbarTextInputClassName} ${className}`.trim()

  return <input ref={ref} type={type} className={combinedClassName} {...rest} />
})

export const TOOLBAR_ICON_SIZE = 14

const toolbarLabelClassName = `text-xs ${tw.text.secondary} whitespace-nowrap`

export type ToolbarLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export function ToolbarLabel({ className = '', ...rest }: ToolbarLabelProps) {
  const combinedClassName = `${toolbarLabelClassName} ${className}`.trim()

  return <label className={combinedClassName} {...rest} />
}

const toolbarColorWrapClassName = `relative h-4 w-4 rounded overflow-hidden ${tw.border} border`
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

export interface ToolbarSearchDropdownItem {
  id: string
  label: string
  icon?: ReactNode
  description?: string
}

interface ToolbarSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  dropdownItems?: ToolbarSearchDropdownItem[]
  onDropdownSelect?: (item: ToolbarSearchDropdownItem) => void
  shortcut?: string
}

export function ToolbarSearch({
  value,
  onChange,
  placeholder,
  className = '',
  dropdownItems,
  onDropdownSelect,
  shortcut,
}: ToolbarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const showDropdown =
    isFocused && value.trim() && dropdownItems && dropdownItems.length > 0

  useEffect(() => {
    setActiveIndex(-1)
  }, [dropdownItems])

  useEffect(() => {
    if (!shortcut) return
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey
      if (modifier && e.key.toLowerCase() === shortcut.toLowerCase()) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcut])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !dropdownItems) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, dropdownItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      onDropdownSelect?.(dropdownItems[activeIndex])
    } else if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    setIsFocused(false)
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-48 ml-2 ${className}`}
      onBlur={handleBlur}
    >
      <Search
        size={14}
        className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary}`}
      />
      <ToolbarTextInput
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full pl-7 pr-7 py-1 ${tw.bg.input} ${tw.primary.focusBorder} placeholder:${tw.text.tertiary} dark:placeholder:${tw.text.tertiary}`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary} hover:${tw.text.primary}`}
        >
          <X size={14} />
        </button>
      )}
      {showDropdown && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-md shadow-lg border z-50 ${tw.bg.primary} ${tw.border}`}
        >
          {dropdownItems?.map((item, index) => (
            <button
              key={item.id}
              tabIndex={-1}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs cursor-pointer ${
                index === activeIndex ? tw.bg.select : tw.hover
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onDropdownSelect?.(item)}
              title={item.description}
            >
              {item.icon && (
                <span className={`flex-shrink-0 ${tw.text.tertiary}`}>
                  {item.icon}
                </span>
              )}
              <span className={`truncate ${tw.text.primary}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
