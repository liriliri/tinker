import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import store from '../store'
import type Transfer from '../store/Transfer'

interface TransferItemProps {
  transfer: Transfer
}

const TransferItem = observer(function TransferItem({
  transfer,
}: TransferItemProps) {
  const { t } = useTranslation()
  const isRunning =
    transfer.status === 'running' || transfer.status === 'pending'
  const isFailed = transfer.status === 'failed'

  return (
    <div
      className={`relative overflow-hidden px-2 py-1.5 border-b ${tw.border} ${
        tw.hover
      } ${isFailed ? 'bg-red-500/5' : ''}`}
    >
      {isRunning && (
        <div
          className="absolute left-0 top-0 h-full bg-green-500/10 transition-all duration-300"
          style={{ width: `${transfer.progress}%` }}
        />
      )}
      <div className="relative z-10 flex items-center w-full">
        <div className="flex-1 min-w-0 mr-2">
          <div className={`text-sm font-bold truncate ${tw.text.primary}`}>
            {transfer.fileName}
          </div>
          <div className={`text-xs ${tw.text.secondary}`}>
            {isRunning && transfer.total > 0 && (
              <>
                {fileSize(transfer.transferred)}B / {fileSize(transfer.total)}B
              </>
            )}
            {isRunning && transfer.total <= 0 && t('transferInProgress')}
            {transfer.status === 'completed' &&
              transfer.total > 0 &&
              `${fileSize(transfer.total)}B`}
            {transfer.status === 'completed' &&
              transfer.total <= 0 &&
              t('transferCompleted')}
            {isFailed && t('transferFailed')}
          </div>
          {isFailed && transfer.error && (
            <div className="text-xs text-red-500 mt-1 break-words">
              {transfer.error}
            </div>
          )}
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
