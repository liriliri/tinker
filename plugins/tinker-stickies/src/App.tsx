import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Plus, FileText } from 'lucide-react'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from './store'
import StickyCard from './components/StickyCard'

export default observer(function App() {
  const { t, i18n } = useTranslation()

  const stickies = store.filteredStickies

  return (
    <ConfirmProvider locale={i18n.language}>
      <ToasterProvider>
        <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
          <Toolbar>
            <ToolbarButton
              onClick={() => store.addSticky()}
              title={t('addSticky')}
            >
              <Plus size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>
            <ToolbarSpacer />
            <ToolbarSearch
              value={store.searchQuery}
              onChange={(v) => store.setSearchQuery(v)}
              placeholder={t('searchPlaceholder')}
            />
          </Toolbar>

          <div className="flex-1 overflow-y-auto p-4">
            {stickies.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText
                    size={48}
                    className={`mx-auto ${tw.text.secondary} opacity-30 mb-3`}
                  />
                  <p className={`text-sm ${tw.text.secondary}`}>
                    {store.searchQuery ? t('noSearchResults') : t('noStickies')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                {stickies.map((sticky) => (
                  <StickyCard key={sticky.id} sticky={sticky} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})
