import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import store from './store'
import Toolbar from './components/Toolbar'
import PreloadAPITab from './components/PreloadAPITab'
import ThemeTab from './components/ThemeTab'
import StorageTab from './components/StorageTab'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  const tabs = [
    { id: 'preload', label: t('preload') },
    { id: 'theme', label: t('theme') },
    { id: 'storage', label: t('storage') },
  ]

  return (
    <AlertProvider locale={i18n.language}>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.both.primary}`}
      >
        <Toolbar tabs={tabs} />

        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
          {store.activeTab === 'preload' && <PreloadAPITab />}
          {store.activeTab === 'theme' && <ThemeTab />}
          {store.activeTab === 'storage' && <StorageTab />}
        </div>
      </div>
    </AlertProvider>
  )
})
