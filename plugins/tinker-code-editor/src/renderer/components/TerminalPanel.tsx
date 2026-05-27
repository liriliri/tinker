import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Terminal as TerminalIcon,
  Columns2,
  Columns3,
  Grid2x2,
} from 'lucide-react'
import { tw } from 'share/theme'
import TabBar from 'share/components/TabBar'
import store from '../store'
import SplitLayout from './SplitLayout'
import { destroyPane } from './Terminal'

store.onDestroyPane = destroyPane

export default observer(function TerminalPanel() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full">
      <div
        className={`relative flex items-center h-10 min-h-[40px] -mt-px ${tw.bg.secondary}`}
      >
        <div className="flex-1 min-w-0 h-full">
          <TabBar
            tabs={store.terminalTabs}
            activeTabId={store.activeTerminalTabId}
            hideFirstBorder
            onAddTab={() => store.addTerminalTab()}
            onClose={(id) => store.closeTerminalTab(id)}
            onActivate={(id) => store.setActiveTerminalTab(id)}
            onMove={(from, to) => store.moveTerminalTab(from, to)}
            renderIcon={() => (
              <TerminalIcon size={12} className={tw.text.tertiary} />
            )}
          />
        </div>
        <div className="flex-shrink-0 flex items-center justify-center h-full px-1.5">
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={() => store.setDualColumns()}
            title={t('dualColumns')}
          >
            <Columns2 size={14} className={tw.text.secondary} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={() => store.setTripleColumns()}
            title={t('tripleColumns')}
          >
            <Columns3 size={14} className={tw.text.secondary} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={() => store.setGrid()}
            title={t('gridLayout')}
          >
            <Grid2x2 size={14} className={tw.text.secondary} />
          </button>
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
        />
      </div>
      <div className="flex-1 relative overflow-hidden">
        {store.terminalTabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{
              display: tab.id === store.activeTerminalTabId ? 'block' : 'none',
            }}
          >
            <SplitLayout node={tab.layout} />
          </div>
        ))}
      </div>
    </div>
  )
})
