import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import store from './store'
import Welcome from './components/Welcome'
import Toolbar from './components/Toolbar'
import GroupTree from './components/GroupTree'
import EntryList from './components/EntryList'
import EntryDetail from './components/EntryDetail'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['left', 'center', 'right'],
    id: 'tinker-password-manager-layout',
    storage: localStorage,
  })

  if (store.isLocked) {
    return (
      <AlertProvider>
        <PromptProvider>
          <ToasterProvider>
            <Welcome />
          </ToasterProvider>
        </PromptProvider>
      </AlertProvider>
    )
  }

  return (
    <AlertProvider>
      <ConfirmProvider>
        <PromptProvider>
          <ToasterProvider>
            <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
              <Toolbar />

              <div className="flex-1 overflow-hidden">
                <Group
                  orientation="horizontal"
                  className="h-full"
                  defaultLayout={defaultLayout}
                  onLayoutChange={onLayoutChange}
                >
                  {/* Left Panel - Groups */}
                  <Panel id="left" minSize={200}>
                    <div
                      className={`h-full ${tw.bg.tertiary} overflow-y-auto overflow-x-hidden`}
                    >
                      <GroupTree />
                    </div>
                  </Panel>

                  <Separator />

                  {/* Center Panel - Entry List */}
                  <Panel id="center" minSize={300}>
                    <div className="h-full overflow-hidden">
                      <EntryList />
                    </div>
                  </Panel>

                  <Separator />

                  {/* Right Panel - Entry Detail */}
                  <Panel id="right" minSize={300}>
                    <div className="h-full overflow-hidden">
                      <EntryDetail />
                    </div>
                  </Panel>
                </Group>
              </div>
            </div>
          </ToasterProvider>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
