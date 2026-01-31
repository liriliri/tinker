import React, { ReactNode } from 'react'
import { tw } from '../theme'

interface ToolbarProps {
  children: ReactNode
  className?: string
}

export function Toolbar({ children, className = '' }: ToolbarProps) {
  const baseClass = `${tw.bg.light.secondary} ${tw.bg.dark.secondary} border-b ${tw.border.both} ${tw.text.dark.primary} px-1.5 py-1.5 flex gap-1 items-center`

  return <div className={`${baseClass} ${className}`}>{children}</div>
}

export function ToolbarSeparator() {
  return <div className={`w-px h-5 ${tw.border.bg} mx-1`} />
}

export function ToolbarSpacer() {
  return <div className="flex-1" />
}

const toolbarTextInputClassName = `w-32 px-2 py-1 text-xs rounded border ${tw.border.both} ${tw.bg.both.primary} ${tw.text.both.primary} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`

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
