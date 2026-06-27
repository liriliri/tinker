import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import type Explorer from '../store/Explorer'
import ExplorerToolbar from './ExplorerToolbar'
import FileList from './FileList'
import FileGrid from './FileGrid'
import TransferPanel from './TransferPanel'
import store from '../store'

interface ExplorerPaneProps {
  tab: Explorer
}

export default observer(function ExplorerPane({ tab }: ExplorerPaneProps) {
  const { t } = useTranslation()

  if (tab.connecting) {
    return (
      <div
        className={`flex items-center justify-center h-full text-sm ${tw.text.tertiary}`}
      >
        {t('connecting')}
      </div>
    )
  }

  if (!tab.connected) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full gap-2 text-sm px-4 text-center ${tw.text.tertiary}`}
      >
        <p>{tab.connectionError ? tab.connectionError : t('disconnected')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ExplorerToolbar tab={tab} />
      <div className="flex-1 min-h-0 overflow-hidden flex">
        <div className="flex-1 min-h-0 overflow-hidden">
          {store.viewMode === 'list' ? (
            <FileList tab={tab} />
          ) : (
            <FileGrid tab={tab} />
          )}
        </div>
        {store.transferPanelOpen && <TransferPanel />}
      </div>
    </div>
  )
})
