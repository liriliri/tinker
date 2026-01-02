import { observer } from 'mobx-react-lite'
import { Copy, Check } from 'lucide-react'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { tw } from 'share/theme'

interface HashResultProps {
  label: string
  value: string
}

export default observer(function HashResult({ label, value }: HashResultProps) {
  const { copied, copyToClipboard } = useCopyToClipboard()

  const handleCopy = async () => {
    await copyToClipboard(value)
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        readOnly
        className={`w-full px-3 py-2 pb-10 text-sm font-mono border ${tw.border.both} rounded-lg ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} resize-none focus:outline-none`}
        rows={3}
      />
      <div
        className={`absolute bottom-3 px-3 py-1 text-xs font-medium pointer-events-none ${tw.primary.text}`}
      >
        {label.toUpperCase()}
      </div>
      <button
        onClick={handleCopy}
        disabled={!value}
        className={`absolute bottom-2 right-2 w-10 h-10 flex items-center justify-center ${
          copied
            ? tw.primary.text
            : `${tw.text.light.tertiary} ${tw.text.dark.tertiary}`
        } rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
        title="Copy to clipboard"
      >
        {copied ? <Check size={20} /> : <Copy size={20} />}
      </button>
    </div>
  )
})
