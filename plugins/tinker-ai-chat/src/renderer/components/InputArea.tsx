import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import Select from 'share/components/Select'
import Dialog, { DialogButton } from 'share/components/Dialog'
import { ChatInput } from 'share/components/AiChat'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function InputArea() {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState('')

  function openSettings() {
    setDraftPrompt(store.systemPrompt)
    setSettingsOpen(true)
  }

  function saveSettings() {
    store.setSystemPrompt(draftPrompt)
    setSettingsOpen(false)
  }

  const modelSelect = (
    <>
      {store.providers.length === 0 ? (
        <Select
          value=""
          onChange={() => {}}
          options={[{ value: '', label: t('noProviders') }]}
          className="max-w-48"
          disabled={true}
        />
      ) : (
        <Select
          value={store.selectedCombined}
          onChange={(val) => store.setSelectedCombined(val as string)}
          options={store.combinedOptions}
          className="max-w-48"
        />
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
    </>
  )

  return (
    <>
      <ChatInput
        value={store.input}
        onChange={(v) => store.setInput(v)}
        onSend={() => store.sendMessage()}
        onStop={() => store.abortGeneration()}
        isGenerating={store.isGenerating}
        canSend={store.canSend}
        placeholder={t('inputPlaceholder')}
        sendLabel={`${t('send')} (Enter)`}
        stopLabel={t('stop')}
        extra={modelSelect}
      />

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t('systemPrompt')}
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
    </>
  )
})
