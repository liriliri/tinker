import { observer } from 'mobx-react-lite'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import store from './store'
import ThemeSync from './components/ThemeSync'

export default observer(function App() {
  return (
    <div className="h-screen w-screen">
      <Tldraw persistenceKey="tinker-whiteboard">
        <ThemeSync />
      </Tldraw>
    </div>
  )
})
