import { observer } from 'mobx-react-lite'
import { Toaster } from 'react-hot-toast'
import { tw } from 'share/theme'
import RecorderControls from './components/RecorderControls'

export default observer(function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-text, #333)',
          },
        }}
      />
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.both.secondary}`}
      >
        <RecorderControls />
      </div>
    </>
  )
})
