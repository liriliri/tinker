import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import TabBar from './components/TabBar'
import NavigationBar from './components/NavigationBar'
import WebviewContainer from './components/WebviewContainer'

export default observer(function App() {
  return (
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <TabBar />
      <NavigationBar />
      <WebviewContainer />
    </div>
  )
})
