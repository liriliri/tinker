import { observer } from 'mobx-react-lite'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import ConnectionList from './components/ConnectionList'
import MessageList, { MessageToolbar } from './components/MessageList'
import MessageDetail from './components/MessageDetail'
import SendPanel from './components/SendPanel'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['sidebar', 'main'],
    id: 'tinker-websocket-layout',
    storage: localStorage,
  })

  return (
    <PromptProvider>
      <ToasterProvider>
        <div
          className={`h-screen flex flex-col ${tw.bg.primary} ${tw.text.primary}`}
        >
          <div className={`border-t ${tw.border}`} />
          <div className="flex-1 overflow-hidden">
            <Group
              orientation="horizontal"
              className="h-full"
              defaultLayout={defaultLayout}
              onLayoutChange={onLayoutChange}
            >
              <Panel id="sidebar" minSize={150} defaultSize={200}>
                <div className={`h-full ${tw.bg.tertiary} overflow-hidden`}>
                  <ConnectionList />
                </div>
              </Panel>

              <Separator />

              <Panel id="main" minSize={400}>
                <div className="h-full flex flex-col min-h-0">
                  <MessageToolbar />
                  <div className="min-h-0 flex-1 flex flex-col">
                    <div className={`min-h-0 flex-1 border-b ${tw.border}`}>
                      <MessageList />
                    </div>
                    <div className="min-h-0 flex-1 flex flex-col">
                      <div className="flex-1 min-h-0 overflow-hidden">
                        <MessageDetail />
                      </div>
                      <div className="h-28 flex-shrink-0">
                        <SendPanel />
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </Group>
          </div>
        </div>
      </ToasterProvider>
    </PromptProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
