import React from 'react'
import { tw } from '../theme'

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>

export default function TextInput({
  className = '',
  type = 'text',
  ...rest
}: TextInputProps) {
  const baseClassName = `w-full px-3 py-2 border ${tw.border.both} ${tw.primary.focusBorder} rounded ${tw.bg.both.primary} ${tw.text.light.primary} ${tw.text.dark.primary} focus:outline-none`
  const combinedClassName = `${baseClassName} ${className}`.trim()

  return <input type={type} className={combinedClassName} {...rest} />
}
