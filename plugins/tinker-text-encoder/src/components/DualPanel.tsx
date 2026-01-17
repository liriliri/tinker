import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import Toolbar from './Toolbar'

export default observer(function DualPanel() {
  const { t } = useTranslation()

  return (
    <div className="h-full w-full flex flex-col">
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className={`flex-1 min-w-0 border-r ${tw.border.both}`}>
          <textarea
            value={store.inputText}
            onChange={(e) => {
              store.setInputText(e.target.value)
              store.clearOutput()
            }}
            className={`w-full h-full p-4 resize-none outline-none ${tw.bg.both.primary} text-gray-800 dark:text-gray-200`}
            placeholder={t('inputPlaceholder')}
          />
        </div>

        {/* Right Panel - Output */}
        <div className="flex-1 min-w-0">
          <div
            className={`w-full h-full p-4 overflow-auto whitespace-pre-wrap break-words ${tw.bg.both.primary} text-gray-800 dark:text-gray-200`}
          >
            {store.outputText || (
              <span className="text-gray-400 dark:text-gray-500">
                {t('outputPlaceholder')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
