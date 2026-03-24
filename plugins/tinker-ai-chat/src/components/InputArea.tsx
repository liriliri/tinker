import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Settings, Square } from 'lucide-react'
import Select from 'share/components/Select'
import Dialog, { DialogButton } from 'share/components/Dialog'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function InputArea() {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      store.sendMessage()
    }
  }

  function openSettings() {
    setDraftPrompt(store.systemPrompt)
    setSettingsOpen(true)
  }

  function saveSettings() {
    store.setSystemPrompt(draftPrompt)
    setSettingsOpen(false)
  }

  return (
    <div className="px-3 pb-3">
      <div
        className={`flex flex-col rounded-lg border ${tw.border} ${tw.bg.input}`}
      >
        {/* Textarea */}
        <textarea
          value={store.input}
          onChange={(e) => store.setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('inputPlaceholder')}
          rows={3}
          className={`w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm outline-none ${tw.text.primary}`}
          disabled={store.isGenerating}
        />

        {/* Bottom action bar */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          {store.providers.length === 0 ? (
            <p className={`flex-1 text-xs ${tw.text.tertiary}`}>
              {t('noProviders')}
            </p>
          ) : (
            <>
              <Select
                value={store.selectedCombined}
                onChange={(val) => store.setSelectedCombined(val as string)}
                options={store.combinedOptions}
                className="max-w-48"
              />
            </>
          )}

          <button
            onClick={openSettings}
            title={t('settings')}
            className={`shrink-0 w-6 h-6 rounded flex items-center justify-center ${
              tw.hover
            } ${store.systemPrompt ? tw.primary.text : tw.text.tertiary}`}
          >
            <Settings size={12} />
          </button>

          <div className="flex-1" />

          {store.isGenerating ? (
            <button
              onClick={() => store.abortGeneration()}
              title={t('stop')}
              className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${tw.hover} ${tw.text.secondary}`}
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => store.sendMessage()}
              title={`${t('send')} (Enter)`}
              disabled={!store.canSend}
              className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed ${tw.primary.bg} ${tw.primary.bgHover}`}
            >
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

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
            <DialogButton variant="text" onClick={() => setSettingsOpen(false)}>
              {t('cancel')}
            </DialogButton>
            <DialogButton onClick={saveSettings}>{t('save')}</DialogButton>
          </div>
        </div>
      </Dialog>
    </div>
  )
})
