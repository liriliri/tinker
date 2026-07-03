import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChatClearButton } from 'share/components/AiChat'
import { Toolbar, ToolbarSpacer } from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../../store'

export default observer(function ChatToolbar() {
  const { t } = useTranslation()
  const { chat } = store

  return (
    <Toolbar className={`border-b ${tw.border}`}>
      <span className={`text-sm font-medium ${tw.text.primary}`}>
        {t('chatTitle')}
      </span>
      <ToolbarSpacer />
      <ChatClearButton
        onClick={() => chat.clearMessages()}
        disabled={!chat.messages.length}
      />
    </Toolbar>
  )
})
