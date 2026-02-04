import React, { ButtonHTMLAttributes, ReactNode } from 'react'
import { tw } from '../theme'

interface ToolbarProps {
  children: ReactNode
  className?: string
}

export function Toolbar({ children, className = '' }: ToolbarProps) {
  const baseClass = `${tw.bg.light.secondary} ${tw.bg.dark.secondary} border-b ${tw.border.both} ${tw.text.dark.primary} px-1.5 py-1.5 flex gap-1 items-center`

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
  const baseClass = `flex items-center overflow-hidden rounded border -my-px ${tw.border.both} ${tw.bg.both.secondary}`

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

export function ToolbarSeparator() {
  return <div className={`w-px h-5 ${tw.border.bg} mx-1`} />
}

export function ToolbarSpacer() {
  return <div className="flex-1" />
}

const toolbarTextInputClassName = `w-32 px-2 py-1 text-xs rounded border ${tw.border.both} ${tw.bg.both.input} ${tw.text.both.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`

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
const toolbarColorSwatchClassName = `h-full w-full ${tw.bg.both.primary}`
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
