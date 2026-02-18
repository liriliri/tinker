import { observer } from 'mobx-react-lite'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import ColorPicker from './components/ColorPicker'
import ColorSchemes from './components/ColorSchemes'
import ColorFormats from './components/ColorFormats'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  return (
    <ToasterProvider>
      <div
        className={`h-screen w-screen flex flex-col overflow-hidden ${tw.bg.primary}`}
      >
        <Toolbar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden transition-colors">
          {/* Left side - Color Picker */}
          <div className="flex-1 flex items-center justify-center p-6 min-w-0">
            <ColorPicker />
          </div>

          {/* Right sidebar - Color Info Blocks */}
          <div
            className={`w-[400px] flex-shrink-0 flex flex-col gap-6 ${tw.bg.tertiary} p-6 shadow-lg overflow-y-auto border-l ${tw.border.both}`}
          >
            <ColorFormats />
            <div className={`border-t ${tw.border.both}`}></div>
            <ColorSchemes />
          </div>
        </div>
      </div>
    </ToasterProvider>
  )
})
