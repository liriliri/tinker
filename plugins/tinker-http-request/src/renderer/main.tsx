import { observer } from 'mobx-react-lite'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw } from 'share/theme'
import UrlBar from './components/UrlBar'
import RequestPanel from './components/RequestPanel'
import ResponsePanel from './components/ResponsePanel'
import CollectionTree from './components/CollectionTree'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['sidebar', 'main'],
    id: 'tinker-http-request-layout',
    storage: localStorage,
  })

  return (
    <ConfirmProvider>
      <PromptProvider>
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
                  <CollectionTree />
                </div>
              </Panel>

              <Separator />

              <Panel id="main" minSize={400}>
                <div className="h-full flex flex-col">
                  <UrlBar />
                  <div
                    className={`flex-1 flex flex-col min-h-0 border-b ${tw.border}`}
                  >
                    <RequestPanel />
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <ResponsePanel />
                  </div>
                </div>
              </Panel>
            </Group>
          </div>
        </div>
      </PromptProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
