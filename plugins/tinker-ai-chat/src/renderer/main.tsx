import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { ChatInputArea } from 'share/components/AiChat'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import SessionList from './components/SessionList'
import SessionToolbar from './components/SessionToolbar'
import MessageList from './components/MessageList'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
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
                <SessionToolbar />
                <MessageList />
                <ChatInputArea
                  value={store.input}
                  onChange={(v) => store.setInput(v)}
                  onSend={() => store.sendMessage()}
                  onStop={() => store.abortGeneration()}
                  isGenerating={store.isGenerating}
                  canSend={store.canSend}
                  hasProviders={store.providers.length > 0}
                  selectedCombined={store.selectedCombined}
                  combinedOptions={store.combinedOptions}
                  onModelChange={(val) => store.setSelectedCombined(val)}
                  systemPrompt={store.systemPrompt}
                  onSystemPromptChange={(val) => store.setSystemPrompt(val)}
                />
              </div>
            </div>
          </div>
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
