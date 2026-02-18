import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import { Panel, Group, useDefaultLayout } from 'react-resizable-panels'
import store from './store'
import Welcome from './components/Welcome'
import Toolbar from './components/Toolbar'
import GroupTree from './components/GroupTree'
import EntryList from './components/EntryList'
import EntryDetail from './components/EntryDetail'

export default observer(function App() {
  const { i18n } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['left', 'center', 'right'],
    id: 'tinker-password-manager-layout',
    storage: localStorage,
  })

  if (store.isLocked) {
    return (
      <AlertProvider locale={i18n.language}>
        <PromptProvider locale={i18n.language}>
          <ToasterProvider>
            <Welcome />
          </ToasterProvider>
        </PromptProvider>
      </AlertProvider>
    )
  }

  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <PromptProvider locale={i18n.language}>
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
                      className={`h-full border-r ${tw.border} overflow-hidden`}
                    >
                      <GroupTree />
                    </div>
                  </Panel>

                  {/* Center Panel - Entry List */}
                  <Panel id="center" minSize={300}>
                    <div
                      className={`h-full border-r ${tw.border} overflow-hidden`}
                    >
                      <EntryList />
                    </div>
                  </Panel>

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
