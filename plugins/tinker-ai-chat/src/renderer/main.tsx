import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { PluginChat } from 'share/components/AiChat'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import SessionList from './components/SessionList'
import {
  getAiChatVisibleToolMessages,
  getToolArgSummary,
  renderSearchToolMessage,
} from './lib/chatTools'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const chat = store.activeChat

  return (
    <AlertProvider>
      <ConfirmProvider>
        <ToasterProvider>
          <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
            <div className={`border-t ${tw.border}`} />
            <div className="flex-1 flex overflow-hidden">
              <div
                className={`w-48 shrink-0 flex flex-col overflow-hidden ${tw.bg.tertiary}`}
              >
                <SessionList />
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                {chat && (
                  <PluginChat
                    {...getPluginChatProps(chat)}
                    isDark={store.isDark}
                    title={store.activeTitle || t('newChat')}
                    inputPlaceholder={t('chatInputPlaceholder')}
                    emptyHint={t('chatEmptyHint')}
                    getToolArgSummary={getToolArgSummary}
                    getVisibleToolMessages={getAiChatVisibleToolMessages}
                    renderToolMessage={renderSearchToolMessage}
                    onSend={() => store.sendMessage()}
                    onStop={() => store.abortGeneration()}
                    onClearMessages={() => store.clearActiveMessages()}
                    onRetryLastMessage={() => store.retryLastMessage()}
                    onDeleteMessage={(id) => store.deleteMessage(id)}
                  />
                )}
              </div>
            </div>
          </div>
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
