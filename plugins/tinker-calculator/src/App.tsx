import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import Display from './components/Display'
import Keypad from './components/Keypad'

export default observer(function App() {
  return (
    <div
      className={`h-screen w-full flex items-center justify-center p-4 ${tw.bg.secondary}`}
    >
      <div className="w-full max-w-[1024px]">
        <Display />
        <Keypad />
      </div>
    </div>
  )
})
