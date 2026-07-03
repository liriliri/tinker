import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { ChatInputArea } from 'share/components/AiChat'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import Toolbar from './components/Toolbar'
import MessageList from './components/MessageList'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()

  return (
    <AlertProvider>
      <ConfirmProvider>
        <ToasterProvider>
          <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
            <Toolbar />
            <MessageList />
            <ChatInputArea
              value={store.input}
              onChange={(v) => store.setInput(v)}
              onSend={() => store.sendMessage()}
              onStop={() => store.abortGeneration()}
              isGenerating={store.isGenerating}
              canSend={store.canSend}
              placeholder={t('inputPlaceholder')}
              hasProviders={store.providers.length > 0}
              selectedCombined={store.selectedCombined}
              combinedOptions={store.combinedOptions}
              onModelChange={(val) => store.setSelectedCombined(val)}
            />
          </div>
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
