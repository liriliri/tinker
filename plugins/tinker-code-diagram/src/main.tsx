import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import { useTranslation } from 'react-i18next'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { AlertProvider } from 'share/components/Alert'
import { PluginChat } from 'share/components/AiChat'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import { tw } from 'share/theme'
import DiagramEditor from './components/DiagramEditor'
import DiagramPreview from './components/DiagramPreview'
import Toolbar from './components/Toolbar'
import { getToolArgSummary } from './mcp'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['main', 'chat'],
    id: 'tinker-code-diagram-layout',
    storage: localStorage,
  })

  return (
    <AlertProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />

        <div className="flex-1 overflow-hidden min-h-0">
          <Group
            orientation="horizontal"
            className="h-full"
            defaultLayout={defaultLayout}
            onLayoutChange={onLayoutChange}
          >
            <Panel id="main" minSize={300}>
              <div className="h-full overflow-hidden flex">
                {(store.viewMode === 'split' ||
                  store.viewMode === 'editor') && (
                  <div
                    className={className(
                      'flex-1 min-w-0',
                      store.viewMode === 'split' && ['border-r', tw.border]
                    )}
                  >
                    <DiagramEditor />
                  </div>
                )}

                {(store.viewMode === 'split' ||
                  store.viewMode === 'preview') && (
                  <div className="flex-1 min-w-0">
                    <DiagramPreview />
                  </div>
                )}
              </div>
            </Panel>
            {store.hasAI && store.chatOpen && (
              <>
                <Separator />
                <Panel id="chat" minSize={250} defaultSize={360}>
                  <PluginChat
                    {...getPluginChatProps(store.chat)}
                    isDark={store.isDark}
                    title={t('chatTitle')}
                    inputPlaceholder={t('chatInputPlaceholder')}
                    emptyHint={t('chatEmptyHint')}
                    getToolArgSummary={getToolArgSummary}
                  />
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
