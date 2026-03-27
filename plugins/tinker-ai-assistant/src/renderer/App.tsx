import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
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
            <Toolbar />
            <MessageList />
            <InputArea />
          </div>
        </ToasterProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
