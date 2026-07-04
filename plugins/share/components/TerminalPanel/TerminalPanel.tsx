import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Terminal as TerminalIcon,
  Columns2,
  Columns3,
  Grid2x2,
} from 'lucide-react'
import { tw } from '../../theme'
import TabBar from '../TabBar'
import type TerminalStore from '../../store/Terminal'
import SplitLayout from './SplitLayout'
import { destroyPane } from './TerminalPane'
import { TerminalPanelContext, useTerminalPanel } from './context'
import { I18N_NS } from './i18n'
import './i18n'

export interface TerminalPanelProps {
  terminal: TerminalStore
  isDark: boolean
}

const TerminalPanelInner = observer(function TerminalPanelInner() {
  const { t } = useTranslation(I18N_NS)
  const { terminal } = useTerminalPanel()

  return (
    <div className="flex flex-col h-full">
      <div
        className={`relative flex items-center h-10 min-h-[40px] ${tw.bg.secondary}`}
      >
        <div className="flex-1 min-w-0 h-full">
          <TabBar
            tabs={terminal.tabs}
            activeTabId={terminal.activeTabId}
            hideFirstBorder
            onAddTab={() => terminal.addTab()}
            onClose={(id) => terminal.closeTab(id)}
            onActivate={(id) => terminal.setActiveTab(id)}
            onMove={(from, to) => terminal.moveTab(from, to)}
            renderIcon={() => (
              <TerminalIcon size={12} className={tw.text.tertiary} />
            )}
          />
        </div>
        <div className="flex-shrink-0 flex items-center justify-center h-full px-1.5">
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={() => terminal.setDualColumns()}
            title={t('dualColumns')}
          >
            <Columns2 size={14} className={tw.text.secondary} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={() => terminal.setTripleColumns()}
            title={t('tripleColumns')}
          >
            <Columns3 size={14} className={tw.text.secondary} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={() => terminal.setGrid()}
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
        {terminal.tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{
              display: tab.id === terminal.activeTabId ? 'block' : 'none',
            }}
          >
            <SplitLayout node={tab.layout} />
          </div>
        ))}
      </div>
    </div>
  )
})

export default function TerminalPanel({
  terminal,
  isDark,
}: TerminalPanelProps) {
  useEffect(() => {
    terminal.onDestroyPane = destroyPane
    return () => {
      terminal.onDestroyPane = undefined
    }
  }, [terminal])

  return (
    <TerminalPanelContext.Provider value={{ terminal, isDark }}>
      <TerminalPanelInner />
    </TerminalPanelContext.Provider>
  )
}
