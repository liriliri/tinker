import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FilePlus, FolderPlus, ListX } from 'lucide-react'
import {
  Toolbar as ToolbarBase,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { confirm } from 'share/components/Confirm'
import Select from 'share/components/Select'
import toast from 'react-hot-toast'
import fileSize from 'licia/fileSize'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import { tw } from 'share/theme'
import { SHRED_METHODS, SHRED_METHOD_LABEL_KEYS } from '../../common/types'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const methodOptions = useMemo(
    () =>
      map(SHRED_METHODS, (method) => ({
        value: method,
        label: t(SHRED_METHOD_LABEL_KEYS[method]),
      })),
    [t]
  )

  const handleClear = () => {
    if (!store.hasFiles || store.shredding) return
    store.clearFiles()
  }

  const handleShred = async () => {
    const ok = await confirm({
      title: t('confirmShred'),
      message: t('confirmShredMessage', { count: store.pendingCount }),
    })
    if (!ok) return

    const result = await store.shredAll()
    if (!result) return

    if (result.shredded > 0) {
      toast.success(t('shredSuccess', { count: result.shredded }))
    }
    if (!isEmpty(result.errors)) {
      toast.error(t('shredErrors', { count: result.errors.length }))
    }
  }

  return (
    <ToolbarBase>
      <ToolbarButton
        onClick={() => store.addFiles()}
        disabled={store.shredding}
        title={t('addFiles')}
      >
        <FilePlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.addFolder()}
        disabled={store.shredding}
        title={t('addFolder')}
      >
        <FolderPlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleClear}
        disabled={store.shredding || !store.hasFiles}
        title={t('clearAll')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      {!store.shredding && store.hasFiles && (
        <span className={`text-xs ${tw.text.secondary}`}>
          {t('fileInfo', {
            count: store.pendingCount,
            size: fileSize(store.pendingSize),
          })}
        </span>
      )}
      <ToolbarSpacer />
      {store.shredding ? (
        <>
          <span className={`text-xs ${tw.text.secondary} mr-2 tabular-nums`}>
            {t('shreddingProgress', { progress: store.overallProgress })}
          </span>
          <ToolbarTextButton onClick={() => store.cancelShred()}>
            {t('cancel')}
          </ToolbarTextButton>
        </>
      ) : (
        <>
          <Select
            value={store.shredMethod}
            onChange={(value) => store.setShredMethod(value)}
            options={methodOptions}
            title={t('shredMethod')}
            className="w-36 mr-2"
          />
          <ToolbarTextButton
            onClick={handleShred}
            disabled={store.pendingCount === 0}
          >
            {t('shred')}
          </ToolbarTextButton>
        </>
      )}
    </ToolbarBase>
  )
})
