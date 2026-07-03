import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChatInputArea } from 'share/components/AiChat'
import { tw } from 'share/theme'
import store from '../../store'
import ChatToolbar from './ChatToolbar'
import MessageList from './MessageList'

export default observer(function ChatPanel() {
  const { t } = useTranslation()
  const { chat } = store

  return (
    <div className={`h-full flex flex-col overflow-hidden ${tw.bg.primary}`}>
      <ChatToolbar />
      <MessageList />
      <ChatInputArea
        value={chat.input}
        onChange={(v) => chat.setInput(v)}
        onSend={() => chat.sendMessage()}
        onStop={() => chat.abortGeneration()}
        isGenerating={chat.isGenerating}
        canSend={chat.canSend}
        placeholder={t('chatInputPlaceholder')}
        hasProviders={chat.providers.length > 0}
        selectedCombined={chat.selectedCombined}
        combinedOptions={chat.combinedOptions}
        onModelChange={(val) => chat.setSelectedCombined(val)}
      />
    </div>
  )
})
