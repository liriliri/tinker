import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import Preview from './components/Preview'

export default observer(function App() {
  return (
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <Toolbar />
      <Preview />
    </div>
  )
})
