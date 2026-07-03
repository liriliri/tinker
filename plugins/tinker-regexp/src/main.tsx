import { observer } from 'mobx-react-lite'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import ExpressionSection from './components/ExpressionSection'
import TextSection from './components/TextSection'
import ChatPanel from './components/chat/ChatPanel'
import renderApp from 'share/lib/renderApp'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['main', 'chat'],
    id: 'tinker-regexp-layout',
    storage: localStorage,
  })

  return (
    <AlertProvider>
      <div
        className={`h-screen flex flex-col ${tw.bg.primary} transition-colors`}
      >
        <Toolbar />
        <div className="flex-1 overflow-hidden min-h-0">
          <Group
            orientation="horizontal"
            className="h-full"
            defaultLayout={defaultLayout}
            onLayoutChange={onLayoutChange}
          >
            <Panel id="main" minSize={300}>
              <div className="h-full flex flex-col min-h-0">
                <ExpressionSection />
                <TextSection />
              </div>
            </Panel>
            {store.hasAI && store.chatOpen && (
              <>
                <Separator />
                <Panel id="chat" minSize={250} defaultSize={360}>
                  <ChatPanel />
                </Panel>
              </>
            )}
          </Group>
        </div>
      </div>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
