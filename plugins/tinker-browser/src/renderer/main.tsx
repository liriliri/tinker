import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { PluginChat } from 'share/components/AiChat'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import store from './store'
import TabBar from './components/TabBar'
import Toolbar from './components/Toolbar'
import WebviewContainer from './components/WebviewContainer'
import { getToolArgSummary, getVisibleToolMessages } from './lib/chatTools'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const tab = store.activeTab
  const showChat = Boolean(store.hasAI && tab?.chatOpen && tab?.url)
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['browser', 'chat'],
    id: `tinker-browser-tab-${tab?.id ?? 'default'}`,
    storage: localStorage,
  })

  return (
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <TabBar />
      <Toolbar />
      <div className="flex-1 min-h-0 overflow-hidden">
        <Group
          orientation="horizontal"
          className="h-full"
          defaultLayout={defaultLayout}
          onLayoutChange={onLayoutChange}
        >
          <Panel id="browser" minSize={400}>
            <div className="h-full min-h-0 overflow-hidden">
              <WebviewContainer />
            </div>
          </Panel>
          {showChat && tab && (
            <>
              <Separator />
              <Panel id="chat" minSize={250} defaultSize={360}>
                <PluginChat
                  {...getPluginChatProps(tab.chat)}
                  isDark={store.isDark}
                  title={t('chatTitle')}
                  inputPlaceholder={t('chatInputPlaceholder')}
                  emptyHint={t('chatEmptyHint')}
                  getToolArgSummary={getToolArgSummary}
                  getVisibleToolMessages={getVisibleToolMessages}
                />
              </Panel>
            </>
          )}
        </Group>
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
