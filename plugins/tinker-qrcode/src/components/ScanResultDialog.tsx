import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Dialog, { DialogButton } from 'share/components/Dialog'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ScanResultDialog() {
  const { t } = useTranslation()

  function handleCopy() {
    navigator.clipboard.writeText(store.scanResult)
    toast.success(t('copiedSuccess'))
  }

  return (
    <Dialog
      open={store.isScanResultOpen}
      onClose={() => store.closeScanResult()}
      title={t('scanResult')}
      showClose
    >
      <div className="flex flex-col gap-4">
        <div
          className={`w-full p-3 rounded text-sm font-mono break-all select-text ${tw.bg.primary} ${tw.text.primary} border ${tw.border}`}
        >
          {store.scanResult}
        </div>
        <div className="flex justify-end">
          <DialogButton onClick={handleCopy}>{t('copy')}</DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
