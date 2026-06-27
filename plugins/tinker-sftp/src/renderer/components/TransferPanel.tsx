import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Upload, Download } from 'lucide-react'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import store from '../store'
import type Transfer from '../store/Transfer'

interface TransferItemProps {
  transfer: Transfer
}

function getStatusText(transfer: Transfer, t: (key: string) => string): string {
  const isRunning =
    transfer.status === 'running' || transfer.status === 'pending'

  if (isRunning && transfer.total > 0) {
    return `${fileSize(transfer.transferred)} / ${fileSize(transfer.total)}`
  }
  if (isRunning) {
    return t('transferInProgress')
  }
  if (transfer.status === 'completed' && transfer.total > 0) {
    return fileSize(transfer.total)
  }
  if (transfer.status === 'completed') {
    return t('transferCompleted')
  }
  if (transfer.status === 'failed') {
    return t('transferFailed')
  }
  return ''
}

const TransferItem = observer(function TransferItem({
  transfer,
}: TransferItemProps) {
  const { t } = useTranslation()
  const isRunning =
    transfer.status === 'running' || transfer.status === 'pending'
  const isFailed = transfer.status === 'failed'
  const Icon = transfer.type === 'upload' ? Upload : Download
  const statusText = getStatusText(transfer, t)

  return (
    <div
      className={`relative h-10 overflow-hidden border-b ${tw.border} ${
        tw.hover
      } ${isFailed ? 'bg-red-500/5' : ''}`}
      title={isFailed && transfer.error ? transfer.error : transfer.fileName}
    >
      {isRunning && (
        <div
          className="absolute left-0 top-0 h-full bg-green-500/10 transition-all duration-300"
          style={{ width: `${transfer.progress}%` }}
        />
      )}
      <div className="relative z-10 flex h-full items-center gap-2 px-2">
        <Icon size={14} className={`shrink-0 ${tw.text.tertiary}`} />
        <div className={`flex-1 min-w-0 truncate text-sm ${tw.text.primary}`}>
          {transfer.fileName}
        </div>
        <div
          className={`shrink-0 text-xs whitespace-nowrap ${
            isFailed ? 'text-red-500' : tw.text.secondary
          }`}
        >
          {statusText}
        </div>
      </div>
    </div>
  )
})

export default observer(function TransferPanel() {
  const { t } = useTranslation()
  const hasCompleted = store.transfers.some((item) => !item.isActive)

  return (
    <div
      className={`w-[280px] shrink-0 border-l ${tw.border} ${tw.bg.tertiary} flex flex-col overflow-hidden min-h-0`}
    >
      <OverlayScrollbars defer className="flex-1 min-h-0">
        {store.transfers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className={`text-base ${tw.text.tertiary}`}>
              {t('noTransfers')}
            </div>
          </div>
        ) : (
          store.transfers.map((transfer) => (
            <TransferItem key={transfer.id} transfer={transfer} />
          ))
        )}
      </OverlayScrollbars>
      <div className={`p-3 border-t ${tw.border}`}>
        <button
          type="button"
          className={`w-full px-3 py-1.5 text-xs ${tw.text.secondary} ${tw.hover} rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none`}
          disabled={!hasCompleted}
          onClick={() => store.clearCompletedTransfers()}
        >
          {t('clearCompleted')}
        </button>
      </div>
    </div>
  )
})
