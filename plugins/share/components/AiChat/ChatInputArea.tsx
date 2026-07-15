import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import Dialog, { DialogButton } from '../Dialog'
import { tw } from '../../theme'
import ChatInput from './ChatInput'
import ModelSelect from './ModelSelect'
import { AI_CHAT_NS } from './i18n'

export interface ChatInputAreaProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isGenerating?: boolean
  canSend?: boolean
  placeholder?: string
  rows?: number
  hasProviders: boolean
  selectedCombined: string
  combinedOptions: Array<{ value: string; label: string }>
  onModelChange: (value: string) => void
  systemPrompt?: string
  onSystemPromptChange?: (value: string) => void
}

export default function ChatInputArea({
  value,
  onChange,
  onSend,
  onStop,
  isGenerating = false,
  canSend = true,
  placeholder,
  rows,
  hasProviders,
  selectedCombined,
  combinedOptions,
  onModelChange,
  systemPrompt = '',
  onSystemPromptChange,
}: ChatInputAreaProps) {
  const { t } = useTranslation(AI_CHAT_NS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState('')

  function openSettings() {
    setDraftPrompt(systemPrompt)
    setSettingsOpen(true)
  }

  function saveSettings() {
    onSystemPromptChange?.(draftPrompt)
    setSettingsOpen(false)
  }

  const modelSelect = (
    <>
      <ModelSelect
        value={hasProviders ? selectedCombined : ''}
        onChange={onModelChange}
        options={
          hasProviders
            ? combinedOptions
            : [{ value: '', label: t('noProviders') }]
        }
        disabled={!hasProviders}
      />
      {onSystemPromptChange && (
        <button
          type="button"
          onClick={openSettings}
          title={t('settings')}
          className={`flex size-8 shrink-0 items-center justify-center rounded-sm border-none ${
            tw.hover
          } ${systemPrompt ? tw.primary.text : tw.text.tertiary}`}
        >
          <Settings size={14} />
        </button>
      )}
    </>
  )

  return (
    <>
      <ChatInput
        value={value}
        onChange={onChange}
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
        canSend={canSend}
        placeholder={placeholder}
        rows={rows}
        extra={modelSelect}
      />

      {onSystemPromptChange && (
        <Dialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title={t('systemPrompt')}
          showClose
        >
          <div className="flex flex-col gap-4">
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              placeholder={t('systemPromptPlaceholder')}
              rows={6}
              className={`w-full resize-none rounded border px-3 py-2 text-sm outline-none focus:ring-1 ${tw.bg.input} ${tw.border} ${tw.text.primary} ${tw.primary.focusRing}`}
            />
            <div className="flex justify-end gap-2">
              <DialogButton onClick={saveSettings}>{t('save')}</DialogButton>
            </div>
          </div>
        </Dialog>
      )}
    </>
  )
}
