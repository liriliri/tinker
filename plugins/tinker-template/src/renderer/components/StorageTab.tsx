import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function StorageTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div
        className={`${tw.bg.light.primary} ${tw.bg.dark.primary} rounded-lg p-6 border ${tw.border.both}`}
      >
        <h2
          className={`text-xl font-semibold mb-4 text-gray-900 ${tw.text.dark.primary}`}
        >
          {t('localStorageDemo')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('enterDataToSave')}
            </label>
            <textarea
              value={store.savedData}
              onChange={(e) => store.setSavedData(e.target.value)}
              rows={4}
              placeholder={t('typeToSave')}
              className={`w-full px-3 py-2 border ${tw.border.both} rounded ${tw.bg.light.primary} ${tw.bg.dark.secondary} text-gray-900 ${tw.text.dark.primary} focus:outline-none focus:ring-2 ${tw.primary.focusRing}`}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => store.saveData()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {t('saveToLocalStorage')}
            </button>
            <button
              onClick={() => store.clearData()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {t('clearData')}
            </button>
          </div>
          <div className="bg-[#0fc25e]/10 dark:bg-[#0fc25e]/20 rounded p-4 border border-[#0fc25e]/30">
            <p
              className={`text-sm ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
            >
              {t('dataPersistedNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
