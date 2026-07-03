import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChatClearButton } from 'share/components/AiChat'
import { Toolbar, ToolbarSpacer } from 'share/components/Toolbar'
import { tw } from 'share/theme'
import chatStore from '../../chatStore'

export default observer(function ChatToolbar() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <span className={`px-2 text-sm font-medium ${tw.text.primary}`}>
        {t('chatTitle')}
      </span>
      <ToolbarSpacer />
      <ChatClearButton
        onClick={() => chatStore.clearMessages()}
        disabled={!chatStore.messages.length}
      />
    </Toolbar>
  )
})
