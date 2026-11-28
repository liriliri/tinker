import className from 'licia/className'
import Switch from 'share/components/Switch'
import { tw } from 'share/theme'

interface SwitchRowProps {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export default function SwitchRow({
  label,
  checked,
  disabled = false,
  onChange,
  className: extraClassName = '',
}: SwitchRowProps) {
  return (
    <div
      className={className(
        'flex items-center justify-between gap-2',
        extraClassName
      )}
    >
      <span className={`text-xs ${tw.text.primary}`}>{label}</span>
      <Switch checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  )
}
