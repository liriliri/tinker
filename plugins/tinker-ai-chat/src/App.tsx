import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import SessionList from './components/SessionList'
import SessionToolbar from './components/SessionToolbar'
import MessageList from './components/MessageList'
import InputArea from './components/InputArea'

export default observer(function App() {
  const { i18n } = useTranslation()

  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <ToasterProvider>
          <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
            <div className={`border-t ${tw.border}`} />
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className={`w-48 shrink-0 flex flex-col overflow-hidden ${tw.bg.tertiary}`}>
                <SessionList />
              </div>

              {/* Main */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <SessionToolbar />
                <MessageList />
                <InputArea />
              </div>
            </div>
          </div>
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
