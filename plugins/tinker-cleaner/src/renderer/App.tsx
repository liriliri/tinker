import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ToasterProvider } from 'share/components/Toaster'
import NavList from 'share/components/NavList'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import store from './store'
import { categories } from './lib/rules'
import Toolbar from './components/Toolbar'
import RuleList from './components/RuleList'
import StatusBar from './components/StatusBar'
import ScanningView from './components/ScanningView'
import type { Category } from './types'

export default observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    store.init()
  }, [])

  const navItems = categories.map((cat) => {
    const size =
      cat.id === 'all'
        ? store.totalScannedSize
        : store.getCategorySize(cat.id as Category)
    return {
      id: cat.id,
      label: t(cat.nameKey),
      suffix:
        size > 0 ? (
          <span className={`text-xs tabular-nums ${tw.text.secondary}`}>
            {fileSize(size)}
          </span>
        ) : undefined,
    }
  })

  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
      >
        {store.view === 'scanning' ? (
          <ScanningView />
        ) : (
          <>
            <Toolbar />
            <div className="flex-1 flex overflow-hidden">
              <div
                className={`w-36 flex-shrink-0 border-r ${tw.border} overflow-y-auto`}
              >
                <NavList
                  items={navItems}
                  activeId={store.activeCategory}
                  onSelect={(id) =>
                    store.setActiveCategory(id as Category | 'all')
                  }
                />
              </div>
              <RuleList />
            </div>
            <StatusBar />
          </>
        )}
      </div>
    </ToasterProvider>
  )
})
