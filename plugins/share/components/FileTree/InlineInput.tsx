import { useRef, useEffect } from 'react'
import { tw } from '../../theme'

export default function InlineInput({
  defaultValue,
  onSubmit,
  onCancel,
}: {
  defaultValue?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (defaultValue) {
      const dotIndex = defaultValue.lastIndexOf('.')
      if (dotIndex > 0) {
        inputRef.current?.setSelectionRange(0, dotIndex)
      } else {
        inputRef.current?.select()
      }
    }
  }, [defaultValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = inputRef.current?.value.trim()
      if (val) onSubmit(val)
      else onCancel()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className={`ml-1.5 text-xs h-5 px-1 outline-none border rounded ${tw.border} ${tw.bg.secondary} ${tw.text.primary}`}
      style={{ width: 'calc(100% - 40px)' }}
      defaultValue={defaultValue || ''}
      onKeyDown={handleKeyDown}
      onBlur={onCancel}
    />
  )
}
