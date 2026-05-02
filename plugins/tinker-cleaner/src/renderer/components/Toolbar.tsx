import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Trash2 } from 'lucide-react'
import {
  Toolbar as ToolbarBase,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSeparator,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Checkbox from 'share/components/Checkbox'
import toast from 'react-hot-toast'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleScan = () => {
    if (store.scanning) return
    store.scan()
  }

  const handleClean = () => {
    if (store.selectedCount === 0) return
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    const result = await store.clean()
    if (result.cleaned > 0) {
      toast.success(t('cleanSuccess', { count: result.cleaned }))
    }
    if (result.errors.length > 0) {
      toast.error(t('cleanErrors', { count: result.errors.length }))
    }
    store.scan()
  }

  const handleToggleAll = () => {
    if (store.allFilteredSelected) {
      store.deselectAll()
    } else {
      store.selectAll()
    }
  }

  return (
    <ToolbarBase>
      <ToolbarButton
        onClick={handleScan}
        title={t('scan')}
        disabled={store.scanning || store.cleaning}
      >
        <RefreshCw
          size={TOOLBAR_ICON_SIZE}
          className={store.scanning ? 'animate-spin' : ''}
        />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton onClick={handleToggleAll}>
        <span className="text-xs">
          {store.allFilteredSelected ? t('deselectAll') : t('selectAll')}
        </span>
      </ToolbarButton>
      <ToolbarSpacer />
      {store.selectedCount > 0 && (
        <span className={`text-xs ${tw.text.secondary} mr-2`}>
          {t('selectedInfo', {
            count: store.selectedCount,
            size: fileSize(store.selectedSize),
          })}
        </span>
      )}
      <ToolbarTextButton
        onClick={handleClean}
        disabled={store.selectedCount === 0 || store.scanning || store.cleaning}
      >
        <span className="inline-flex items-center gap-1">
          <Trash2 size={12} />
          {t('clean')}
        </span>
      </ToolbarTextButton>
      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title={t('confirmClean')}
      >
        <p className={`text-sm ${tw.text.secondary} mb-4`}>
          {t('confirmCleanMessage', {
            count: store.selectedCount,
            size: fileSize(store.selectedSize),
          })}
        </p>
        <Checkbox
          checked={store.moveToTrash}
          onChange={(checked) => store.setMoveToTrash(checked)}
          className="mb-6"
        >
          {t('moveToTrash')}
        </Checkbox>
        <div className="flex gap-2 justify-end">
          <DialogButton variant="text" onClick={() => setShowConfirm(false)}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleConfirm}>{t('confirm')}</DialogButton>
        </div>
      </Dialog>
    </ToolbarBase>
  )
})
