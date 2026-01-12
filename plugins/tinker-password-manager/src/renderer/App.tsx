import { observer } from 'mobx-react-lite'
import { Toaster } from 'react-hot-toast'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw, THEME_COLORS } from 'share/theme'
import { Panel, Group, useDefaultLayout } from 'react-resizable-panels'
import store from './store'
import WelcomeScreen from './components/WelcomeScreen'
import Toolbar from './components/Toolbar'
import GroupTree from './components/GroupTree'
import EntryList from './components/EntryList'
import EntryDetail from './components/EntryDetail'

export default observer(function App() {
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['left', 'center', 'right'],
    id: 'tinker-password-manager-layout',
    storage: localStorage,
  })

  if (store.isLocked) {
    return (
      <AlertProvider>
        <PromptProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--toast-bg, #fff)',
                color: 'var(--toast-text, #333)',
              },
              success: {
                iconTheme: {
                  primary: THEME_COLORS.primary,
                  secondary: THEME_COLORS.bg.light.primary,
                },
              },
            }}
          />
          <WelcomeScreen />
        </PromptProvider>
      </AlertProvider>
    )
  }

  return (
    <AlertProvider>
      <ConfirmProvider>
        <PromptProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--toast-bg, #fff)',
                color: 'var(--toast-text, #333)',
              },
              success: {
                iconTheme: {
                  primary: THEME_COLORS.primary,
                  secondary: THEME_COLORS.bg.light.primary,
                },
              },
            }}
          />
          <div
            className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
          >
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
                    className={`h-full border-r ${tw.border.both} overflow-hidden`}
                  >
                    <GroupTree />
                  </div>
                </Panel>

                {/* Center Panel - Entry List */}
                <Panel id="center" minSize={300}>
                  <div
                    className={`h-full border-r ${tw.border.both} overflow-hidden`}
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
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
