import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import ZoomControls from 'share/components/ZoomControls'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import MindMapCanvas from './components/MindMapCanvas'
import Sidebar from './components/Sidebar'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  return (
    <AlertProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-hidden relative">
            <MindMapCanvas />
            <ZoomControls
              scale={store.scale}
              disabled={!store.mindMap}
              presets={[50, 75, 100, 125, 150, 200]}
              onZoomIn={() => store.zoomIn()}
              onZoomOut={() => store.zoomOut()}
              onZoomFit={() => store.fit()}
              onZoomToPercent={(percent) => store.setZoom(percent)}
            />
          </div>
        </div>
      </div>
    </AlertProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
