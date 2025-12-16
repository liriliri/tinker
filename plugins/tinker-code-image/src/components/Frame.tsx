import { observer } from 'mobx-react-lite'
import store from '../store'
import CodeEditor from './CodeEditor'

const Frame = observer(() => {
  const frameColors = store.frameColors
  const checkColor = store.darkMode ? '#333' : '#e8e8e8'

  return (
    <div
      className="flex-1 flex items-center justify-center p-8"
      style={{
        backgroundImage: `
          linear-gradient(45deg, ${checkColor} 25%, transparent 25%),
          linear-gradient(-45deg, ${checkColor} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${checkColor} 75%),
          linear-gradient(-45deg, transparent 75%, ${checkColor} 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: store.darkMode ? '#1a1a1a' : '#fafafa',
      }}
    >
      <div
        id="code-frame"
        className="relative inline-block max-h-full flex flex-col"
        style={{ padding: '16px' }}
      >
        <div
          className="rounded-lg shadow-2xl flex flex-col overflow-hidden"
          style={{
            backgroundColor: frameColors.background,
            minWidth: '400px',
            maxWidth: '800px',
            maxHeight: '100%',
          }}
        >
          <div
            style={{
              backgroundColor: frameColors.titleBar,
              display: 'grid',
              gridTemplateColumns: '80px 1fr 80px',
              gap: '12px',
              alignItems: 'center',
              padding: '0 16px',
              height: '48px',
              flexShrink: 0,
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
                  color: frameColors.title,
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              {store.fileName.length === 0 && (
                <span
                  style={{
                    color: frameColors.title,
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
          <div className="overflow-auto" style={{ minHeight: 0 }}>
            <CodeEditor />
          </div>
        </div>
      </div>
    </div>
  )
})

export default Frame
