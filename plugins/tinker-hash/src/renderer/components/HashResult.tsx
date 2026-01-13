import { observer } from 'mobx-react-lite'
import CopyButton from 'share/components/CopyButton'
import { tw } from 'share/theme'

interface HashResultProps {
  label: string
  value: string
}

export default observer(function HashResult({ label, value }: HashResultProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        readOnly
        className={`w-full px-3 py-2 pb-10 text-sm font-mono border ${tw.border.both} rounded-lg ${tw.bg.both.input} ${tw.text.both.primary} resize-none focus:outline-none`}
        rows={3}
      />
      <div
        className={`absolute bottom-3 px-3 py-1 text-xs font-medium pointer-events-none ${tw.primary.text}`}
      >
        {label.toUpperCase()}
      </div>
      <CopyButton
        variant="icon"
        text={value}
        size={20}
        disabled={!value}
        className="absolute bottom-2 right-2 w-10 h-10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Copy to clipboard"
      />
    </div>
  )
})
