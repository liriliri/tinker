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
            style={{
              backgroundColor: store.darkMode ? '#374151' : '#f3f4f6',
              display: 'grid',
              gridTemplateColumns: '80px 1fr 80px',
              gap: '12px',
              alignItems: 'center',
              padding: '0 16px',
              height: '48px',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input
                type="text"
                value={store.fileName}
                onChange={(e) => store.setFileName(e.target.value)}
                spellCheck={false}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  width: '100%',
                  border: 'none',
                  margin: 0,
                  background: 'transparent',
                  color: store.darkMode ? '#9ca3af' : '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              {store.fileName.length === 0 && (
                <span
                  style={{
                    color: store.darkMode ? '#9ca3af' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: 500,
                    pointerEvents: 'none',
                  }}
                >
                  Untitled-1
                </span>
              )}
            </div>
            <div />
          </div>
          <CodeEditor />
        </div>
      </div>
    </div>
  )
})

export default Frame
