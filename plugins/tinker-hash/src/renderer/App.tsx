import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import store from './store'
import HashResult from './components/HashResult'
import HashToolbar from './components/Toolbar'
import FileOpen from './components/FileOpen'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  return (
    <AlertProvider locale={i18n.language}>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.both.primary}`}
      >
        {/* Toolbar */}
        <HashToolbar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Input */}
          <div className={`w-2/5 flex flex-col ${tw.border.both} border-r`}>
            {store.inputType === 'text' ? (
              <div className="flex-1">
                <textarea
                  value={store.input}
                  onChange={(e) => store.setInput(e.target.value)}
                  placeholder={t('placeholder')}
                  className={`w-full h-full px-3 py-2 text-sm font-mono ${tw.text.both.primary} ${tw.border.both} rounded resize-none focus:outline-none`}
                />
              </div>
            ) : (
              <FileOpen
                onOpenFile={(file) => store.handleFileOpen(file)}
                openTitle={t('openFile')}
                supportedFormats={t('allFiles')}
                fileName={store.fileName}
              />
            )}
          </div>

          {/* Right Panel - Results */}
          <div
            className={`flex-1 p-4 ${tw.bg.both.tertiary} flex flex-col justify-evenly`}
          >
            <HashResult label="md5" value={store.hashResults.md5} />
            <HashResult label="sha1" value={store.hashResults.sha1} />
            <HashResult label="sha256" value={store.hashResults.sha256} />
            <HashResult label="sha512" value={store.hashResults.sha512} />
          </div>
        </div>
      </div>
    </AlertProvider>
  )
})
