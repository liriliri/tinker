import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import store from './store'
import TabNav from './components/TabNav'
import UIComponentsTab from './components/UIComponentsTab'
import PreloadAPITab from './components/PreloadAPITab'
import ThemeTab from './components/ThemeTab'
import StorageTab from './components/StorageTab'

export default observer(function App() {
  const { t } = useTranslation()

  const tabs = [
    { id: 'ui', label: t('ui') },
    { id: 'preload', label: t('preload') },
    { id: 'theme', label: t('theme') },
    { id: 'storage', label: t('storage') },
  ]

  return (
    <AlertProvider>
      <div className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133] transition-colors">
        <TabNav tabs={tabs} />

        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
          {store.activeTab === 'ui' && <UIComponentsTab />}
          {store.activeTab === 'preload' && <PreloadAPITab />}
          {store.activeTab === 'theme' && <ThemeTab />}
          {store.activeTab === 'storage' && <StorageTab />}
        </div>
      </div>
    </AlertProvider>
  )
})
