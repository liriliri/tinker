import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function StorageTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
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
              className="w-full px-3 py-2 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#303133] text-gray-900 dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#0fc25e]"
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
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('dataPersistedNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
