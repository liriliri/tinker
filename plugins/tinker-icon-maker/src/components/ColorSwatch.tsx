import className from 'licia/className'
import { tw } from 'share/theme'

interface ColorSwatchProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export default function ColorSwatch({
  value,
  onChange,
  className: extraClassName = 'h-7 w-10 shrink-0',
}: ColorSwatchProps) {
  return (
    <label
      className={className(
        'relative cursor-pointer overflow-hidden rounded border',
        tw.border,
        extraClassName
      )}
    >
      <span className="block h-full w-full" style={{ background: value }} />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  )
}
