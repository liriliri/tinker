import { ArrowRight, Square } from 'lucide-react'
import { tw } from '../../theme'

export interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isGenerating?: boolean
  canSend?: boolean
  placeholder?: string
  sendLabel?: string
  stopLabel?: string
  rows?: number
  /** Optional slot rendered to the left of the send button (e.g. model selector) */
  extra?: React.ReactNode
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isGenerating = false,
  canSend = true,
  placeholder = 'Type a message...',
  sendLabel = 'Send (Enter)',
  stopLabel = 'Stop',
  rows = 3,
  extra,
}: ChatInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="px-3 pb-3">
      <div
        className={`flex flex-col rounded-lg border ${tw.border} ${tw.bg.input}`}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm outline-none ${tw.text.primary}`}
          disabled={isGenerating}
        />

        <div className="flex items-center gap-2 px-2 py-1.5">
          {extra}

          <div className="flex-1" />

          {isGenerating ? (
            <button
              onClick={onStop}
              title={stopLabel}
              className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${tw.hover} ${tw.text.secondary}`}
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={onSend}
              title={sendLabel}
              disabled={!canSend}
              className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed ${tw.primary.bg} ${tw.primary.bgHover}`}
            >
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
