import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Panel, Group, Separator } from 'react-resizable-panels'
import { useDefaultLayout } from 'share/hooks/useDefaultLayout'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { PluginChat } from 'share/components/AiChat'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import { tw } from 'share/theme'
import renderApp from 'share/lib/renderApp'
import Toolbar from './components/Toolbar'
import EditorPanel from './components/EditorPanel'
import ResumePreview from './components/ResumePreview'
import { getToolArgSummary } from './mcp'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { t } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['main', 'chat'],
  })

  return (
    <AlertProvider>
      <ConfirmProvider>
        <ToasterProvider>
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
                    <EditorPanel />
                    <div className="flex-1 min-w-0">
                      <ResumePreview />
                    </div>
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
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
