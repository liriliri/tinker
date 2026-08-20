import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'

interface FieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

interface FieldTextProps extends FieldProps {
  type?: string
}

interface FieldAreaProps extends FieldProps {
  rows?: number
}

interface FieldRowProps extends FieldTextProps {
  label: string
}

const inputClass = `w-full px-3 py-1.5 text-sm rounded-md border ${tw.border} ${tw.bg.input} ${tw.text.primary} focus:outline-none focus:ring-2 ${tw.primary.focusRing} ${tw.primary.focusBorder}`

interface FieldLabelProps {
  label: string
}

function FieldLabel({ label }: FieldLabelProps) {
  return (
    <span className={`mb-1.5 block text-sm font-medium ${tw.text.primary}`}>
      {label}
    </span>
  )
}

export function FieldText({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: FieldTextProps) {
  return (
    <label className="block">
      {label ? <FieldLabel label={label} /> : null}
      <TextInput
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function FieldArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: FieldAreaProps) {
  return (
    <label className="block">
      {label ? <FieldLabel label={label} /> : null}
      <textarea
        className={`${inputClass} resize-y min-h-[8rem] leading-6`}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: FieldRowProps) {
  return (
    <label className="flex items-center gap-3 px-3 py-2">
      <span className={`w-20 shrink-0 text-sm font-medium ${tw.text.primary}`}>
        {label}
      </span>
      <TextInput
        type={type}
        className="flex-1"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
