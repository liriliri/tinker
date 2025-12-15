import { observer } from 'mobx-react-lite'
import store from '../store'
import CodeEditor from './CodeEditor'

const Frame = observer(() => {
  return (
    <div className="flex-1 flex items-center justify-center overflow-auto p-8">
      <div id="code-frame" className="relative inline-block">
        <div
          className="rounded-lg shadow-2xl overflow-hidden"
          style={{
            backgroundColor: store.darkMode ? '#1f2937' : '#ffffff',
            minWidth: '400px',
            maxWidth: '800px',
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{
              backgroundColor: store.darkMode ? '#374151' : '#f3f4f6',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div
              className="flex-1 text-center text-sm"
              style={{
                color: store.darkMode ? '#9ca3af' : '#6b7280',
              }}
            >
              Untitled-1
            </div>
          </div>
          <CodeEditor />
        </div>
      </div>
    </div>
  )
})

export default Frame
