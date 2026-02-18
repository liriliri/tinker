import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import TimerDisplay from './components/TimerDisplay'
import ControlButton from './components/ControlButton'
import Footer from './components/Footer'

export default observer(function App() {
  const { i18n } = useTranslation()

  return (
    <AlertProvider locale={i18n.language}>
      <div
        className={`h-screen flex flex-col ${tw.bg.secondary} transition-colors overflow-hidden`}
      >
        <div className="flex-1 flex flex-col items-center justify-center">
          <TimerDisplay />
          <ControlButton />
        </div>
        <Footer />
      </div>
    </AlertProvider>
  )
})
