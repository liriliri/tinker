import { observer } from 'mobx-react-lite'
import { ToasterProvider } from 'share/components/Toaster'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import ColorPicker from './components/ColorPicker'
import ColorSchemes from './components/ColorSchemes'
import ColorFormats from './components/ColorFormats'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  return (
    <ToasterProvider>
      <div
        className={`h-screen w-screen flex flex-col overflow-hidden ${tw.bg.primary}`}
      >
        <div className={`border-t ${tw.border}`} />
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden transition-colors">
          {/* Left side - Color Picker */}
          <div className="flex-1 flex flex-col p-4 min-w-0 overflow-y-auto">
            <ColorPicker />
          </div>

          {/* Right sidebar - Color Info Blocks */}
          <OverlayScrollbars
            className={`w-[400px] flex-shrink-0 flex flex-col gap-6 ${tw.bg.tertiary} p-6 shadow-lg border-l ${tw.border}`}
          >
            <ColorFormats />
            <div className={`border-t ${tw.border}`}></div>
            <ColorSchemes />
          </OverlayScrollbars>
        </div>
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
