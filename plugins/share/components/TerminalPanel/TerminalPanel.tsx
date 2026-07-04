import { useTranslation } from 'react-i18next'
import {
  Terminal as TerminalIcon,
  Columns2,
  Columns3,
  Grid2x2,
} from 'lucide-react'
import { tw } from '../../theme'
import TabBar from '../TabBar'
import type {
  TerminalPanelProps,
  TerminalPaneLayoutProps,
} from '../../lib/terminalPanel'
import SplitLayout from './SplitLayout'
import { I18N_NS } from './i18n'
import './i18n'

export type { TerminalPanelProps } from '../../lib/terminalPanel'

export default function TerminalPanel({
  tabs,
  activeTabId,
  activePaneId,
  paneTitles,
  isDark,
  onAddTab,
  onCloseTab,
  onActivateTab,
  onMoveTab,
  onSetDualColumns,
  onSetTripleColumns,
  onSetGrid,
  onSetActivePane,
  onSetPaneTitle,
  onSplitPane,
  onClosePane,
  createSession,
}: TerminalPanelProps) {
  const { t } = useTranslation(I18N_NS)

  const paneProps: TerminalPaneLayoutProps = {
    activePaneId,
    paneTitles,
    isDark,
    onSetActivePane,
    onSetPaneTitle,
    onSplitPane,
    onClosePane,
    createSession,
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className={`relative flex items-center h-10 min-h-[40px] ${tw.bg.secondary}`}
      >
        <div className="flex-1 min-w-0 h-full">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            hideFirstBorder
            onAddTab={onAddTab}
            onClose={onCloseTab}
            onActivate={onActivateTab}
            onMove={onMoveTab}
            renderIcon={() => (
              <TerminalIcon size={12} className={tw.text.tertiary} />
            )}
          />
        </div>
        <div className="flex-shrink-0 flex items-center justify-center h-full px-1.5">
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={onSetDualColumns}
            title={t('dualColumns')}
          >
            <Columns2 size={14} className={tw.text.secondary} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={onSetTripleColumns}
            title={t('tripleColumns')}
          >
            <Columns3 size={14} className={tw.text.secondary} />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${tw.hover}`}
            onClick={onSetGrid}
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
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{
              display: tab.id === activeTabId ? 'block' : 'none',
            }}
          >
            <SplitLayout node={tab.layout} {...paneProps} />
          </div>
        ))}
      </div>
    </div>
  )
}
