import { observer } from 'mobx-react-lite'
import copy from 'licia/copy'
import { alert } from 'share/components/Alert'
import { tw } from 'share/theme'

interface HashResultProps {
  label: string
  value: string
}

export default observer(function HashResult({ label, value }: HashResultProps) {
  const handleCopy = () => {
    if (value) {
      copy(value)
      alert({ title: 'Copied to clipboard!' })
    }
  }

  return (
    <div className="mb-3">
      <div className="flex gap-2">
        <textarea
          value={value}
          readOnly
          placeholder={label.toUpperCase()}
          className={`flex-1 px-3 py-2 text-sm font-mono ${tw.bg.light.primary} ${tw.bg.dark.secondary} ${tw.text.light.primary} ${tw.text.dark.primary} ${tw.border.both} rounded resize-none focus:outline-none`}
          rows={3}
        />
        <button
          onClick={handleCopy}
          disabled={!value}
          className={`px-3 py-1 h-fit text-xs text-white rounded transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${tw.primary.bg} ${tw.primary.bgHover}`}
        >
          {label}
        </button>
      </div>
    </div>
  )
})
