import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw } from 'share/theme'
import store from './store'
import WelcomeScreen from './components/WelcomeScreen'
import Toolbar from './components/Toolbar'
import GroupTree from './components/GroupTree'
import EntryList from './components/EntryList'
import EntryDetail from './components/EntryDetail'

export default observer(function App() {
  if (store.isLocked) {
    return (
      <AlertProvider>
        <PromptProvider>
          <WelcomeScreen />
        </PromptProvider>
      </AlertProvider>
    )
  }

  return (
    <AlertProvider>
      <ConfirmProvider>
        <PromptProvider>
          <div
            className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
          >
            <Toolbar />

            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Groups */}
              <div
                className={`w-48 border-r ${tw.border.both} overflow-hidden`}
              >
                <GroupTree />
              </div>

              {/* Center Panel - Entry List */}
              <div
                className={`flex-1 border-r ${tw.border.both} overflow-hidden`}
              >
                <EntryList />
              </div>

              {/* Right Panel - Entry Detail */}
              <div className="w-80 overflow-hidden">
                <EntryDetail />
              </div>
            </div>
          </div>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
