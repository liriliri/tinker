import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import DualPanel from './components/DualPanel'

export default observer(function App() {
  const { i18n } = useTranslation()

  return (
    <ToasterProvider>
      <AlertProvider locale={i18n.language}>
        <div
          className={`h-screen flex flex-col transition-colors ${tw.bg.both.primary}`}
        >
          <div className="flex-1 overflow-hidden">
            <DualPanel />
          </div>
        </div>
      </AlertProvider>
    </ToasterProvider>
  )
})
