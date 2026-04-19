import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import TabBar from './components/TabBar'
import Toolbar from './components/Toolbar'
import WebviewContainer from './components/WebviewContainer'

export default observer(function App() {
  return (
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <TabBar />
      <Toolbar />
      <WebviewContainer />
    </div>
  )
})
