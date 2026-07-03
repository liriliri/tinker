import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChatInputArea } from 'share/components/AiChat'
import { tw } from 'share/theme'
import chatStore from '../../chatStore'
import ChatToolbar from './ChatToolbar'
import MessageList from './MessageList'

export default observer(function ChatPanel() {
  const { t } = useTranslation()

  return (
    <div className={`h-full flex flex-col overflow-hidden ${tw.bg.primary}`}>
      <ChatToolbar />
      <MessageList />
      <ChatInputArea
        value={chatStore.input}
        onChange={(v) => chatStore.setInput(v)}
        onSend={() => chatStore.sendMessage()}
        onStop={() => chatStore.abortGeneration()}
        isGenerating={chatStore.isGenerating}
        canSend={chatStore.canSend}
        placeholder={t('chatInputPlaceholder')}
        hasProviders={chatStore.providers.length > 0}
        selectedCombined={chatStore.selectedCombined}
        combinedOptions={chatStore.combinedOptions}
        onModelChange={(val) => chatStore.setSelectedCombined(val)}
      />
    </div>
  )
})
