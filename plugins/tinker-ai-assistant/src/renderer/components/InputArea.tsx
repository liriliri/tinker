import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import { ChatInput } from 'share/components/AiChat'
import store from '../store'

export default observer(function InputArea() {
  const { t } = useTranslation()

  const modelSelect =
    store.providers.length === 0 ? (
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
    )

  return (
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
  )
})
