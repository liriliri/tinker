import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { SkipForward, Volume2 } from 'lucide-react'
import store from '../store'

export default observer(function Footer() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-6 pb-4">
      {/* Left: Round counter and Reset */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {store.currentRound}/{store.totalRounds}
        </span>
        <button
          onClick={() => store.reset()}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          {t('reset')}
        </button>
      </div>

      {/* Right: Skip and Volume */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => store.skip()}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <SkipForward size={18} />
        </button>
        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          <Volume2 size={18} />
        </button>
      </div>
    </div>
  )
})
