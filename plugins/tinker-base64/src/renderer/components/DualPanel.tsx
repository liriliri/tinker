import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import Toolbar from './Toolbar'
import FileOpen from './FileOpen'
import store from '../store'

export default observer(function DualPanel() {
  const { t } = useTranslation()

  const renderTextMode = () => (
    <div className="flex-1 flex overflow-hidden">
      <div className={`flex-1 min-w-0 border-r ${tw.border.both}`}>
        <textarea
          value={store.inputText}
          onChange={(e) => store.setInputText(e.target.value)}
          className={`w-full h-full p-4 resize-none outline-none overflow-x-hidden whitespace-pre-wrap break-words ${tw.bg.both.primary} ${tw.text.both.primary}`}
          placeholder={t('inputPlaceholder')}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={`w-full h-full p-4 overflow-auto whitespace-pre-wrap break-words ${tw.bg.both.primary} ${tw.text.both.primary}`}
        >
          {store.outputText || (
            <span className={tw.text.both.secondary}>
              {t('outputPlaceholder')}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  const renderFileMode = () => (
    <div className="flex-1 flex overflow-hidden">
      <div
        className={`w-1/2 min-w-[260px] flex flex-col border-r ${tw.border.both}`}
      >
        <FileOpen
          onOpenFile={(file) => store.handleFile(file)}
          openTitle={t('fileDropTitle')}
          supportedFormats={t('fileSubtitle')}
          fileName={store.fileName}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <textarea
          value={store.fileBase64}
          readOnly
          className={`flex-1 w-full p-4 resize-none outline-none overflow-x-hidden whitespace-pre-wrap break-words ${tw.bg.both.primary} ${tw.text.both.primary}`}
          placeholder={t('fileOutputPlaceholder')}
        />
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
