import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import TimerDisplay from './components/TimerDisplay'
import ControlButton from './components/ControlButton'
import Footer from './components/Footer'

export default observer(function App() {
  return (
    <AlertProvider>
      <div className="h-screen flex flex-col bg-[#2c3e50] dark:bg-[#1a252f] transition-colors">
        <div className="flex-1 flex flex-col items-center justify-center">
          <TimerDisplay />
          <ControlButton />
        </div>
        <Footer />
      </div>
    </AlertProvider>
  )
})
