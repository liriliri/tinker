import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import truncate from 'licia/truncate'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import Toolbar from './Toolbar'
import FileOpen from 'share/components/FileOpen'
import store from '../store'

export default observer(function DualPanel() {
  const { t } = useTranslation()
  const maxOutputLength = 8000
  const truncatedOutputText = store.outputText
    ? truncate(store.outputText, maxOutputLength)
    : ''
  const truncatedFileBase64 = store.fileBase64
    ? truncate(store.fileBase64, maxOutputLength)
    : ''

  const renderTextMode = () => (
    <div className="flex-1 flex overflow-hidden">
      <div className={`flex-1 min-w-0 border-r ${tw.border}`}>
        <textarea
          value={store.inputText}
          onChange={(e) => store.setInputText(e.target.value)}
          className={`w-full h-full p-4 resize-none outline-none overflow-x-hidden whitespace-pre-wrap break-words ${tw.bg.primary} ${tw.text.primary}`}
          placeholder={t('inputPlaceholder')}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          onClick={() =>
            store.outputText && store.copyToClipboardWithToast(store.outputText)
          }
          title={store.outputText ? t('copy') : undefined}
          className={`relative w-full h-full p-4 overflow-auto whitespace-pre-wrap break-words ${
            tw.bg.tertiary
          } ${tw.text.primary} ${store.outputText ? 'cursor-pointer' : ''}`}
        >
          {truncatedOutputText ? (
            truncatedOutputText
          ) : (
            <div className="h-full w-full flex items-center justify-center text-center">
              <span className={tw.text.secondary}>
                {t('outputPlaceholder')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderFileMode = () => (
    <div className="flex-1 flex overflow-hidden">
      <div
        className={`w-1/2 min-w-[260px] flex flex-col border-r ${tw.border}`}
      >
        <FileOpen
          onOpenFile={(file) => store.handleFile(file)}
          openTitle={t('fileDropTitle')}
          supportedFormats=""
          fileName={store.fileName}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col relative">
        <textarea
          value={truncatedFileBase64}
          readOnly
          onClick={() =>
            store.fileBase64 && store.copyToClipboardWithToast(store.fileBase64)
          }
          title={store.fileBase64 ? t('copy') : undefined}
          className={`flex-1 w-full p-4 resize-none outline-none overflow-x-hidden whitespace-pre-wrap break-words ${
            tw.bg.tertiary
          } ${tw.text.primary} ${store.fileBase64 ? 'cursor-pointer' : ''}`}
        />
        {store.isEncodingFile && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <LoadingCircle />
          </div>
        )}
        {!truncatedFileBase64 && !store.isEncodingFile && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className={tw.text.secondary}>
              {t('fileOutputPlaceholder')}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="h-full w-full flex flex-col">
      <Toolbar />

      {store.inputType === 'text' ? renderTextMode() : renderFileMode()}
    </div>
  )
})
