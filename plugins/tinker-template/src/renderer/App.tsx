import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import Toolbar from './components/Toolbar'
import ComponentsTab from './components/ComponentsTab'
import DialogsTab from './components/DialogsTab'
import TinkerAPITab from './components/TinkerAPITab'
import PreloadAPITab from './components/PreloadAPITab'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  const tabs = [
    { id: 'components', label: t('components') },
    { id: 'dialogs', label: t('dialogs') },
    { id: 'tinker', label: t('api') },
    { id: 'preload', label: t('preload') },
  ]

  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <PromptProvider locale={i18n.language}>
          <ToasterProvider>
            <div
              className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
            >
              <Toolbar tabs={tabs} />

              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
                {store.activeTab === 'components' && <ComponentsTab />}
                {store.activeTab === 'dialogs' && <DialogsTab />}
                {store.activeTab === 'tinker' && <TinkerAPITab />}
                {store.activeTab === 'preload' && <PreloadAPITab />}
              </div>
            </div>
          </ToasterProvider>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
