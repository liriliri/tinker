import { observer } from 'mobx-react-lite'
import type { MouseEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import map from 'licia/map'
import toStr from 'licia/toStr'
import { Globe, Pencil, Trash2 } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import { LoadingCircle } from 'share/components/Loading'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import type { WebApp } from '../../common/types'
import store from '../store'

interface IconButtonProps {
  children: ReactNode
  title: string
  onClick: (e: MouseEvent) => void
}

export default observer(function AppList() {
  const { t } = useTranslation()

  if (store.loading && isEmpty(store.apps)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingCircle />
      </div>
    )
  }

  if (isEmpty(store.apps)) {
    return (
      <div
        className={`flex flex-1 flex-col items-center justify-center gap-2 ${tw.text.secondary}`}
      >
        <Globe size={40} className="opacity-40" />
        <div className="text-sm">{t('empty')}</div>
        <div className={`text-xs ${tw.text.tertiary}`}>{t('emptyHint')}</div>
      </div>
    )
  }

  const handleRemove = async (app: WebApp) => {
    const ok = await confirm({
      title: t('deleteConfirm', { name: app.name }),
    })
    if (!ok) return
    try {
      await store.remove(app)
      toast.success(t('deleted'))
    } catch (e) {
      toast.error(isErr(e) ? e.message : toStr(e))
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {map(store.apps, (app) => (
          <div
            key={app.id}
            className={`group flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${tw.border} ${tw.bg.secondary} ${tw.hover}`}
            onClick={() => void store.open(app)}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border ${tw.border} ${tw.bg.primary}`}
            >
              {app.icon ? (
                <img
                  src={fileUrl(app.icon)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Globe size={18} className={tw.text.tertiary} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <div
                  className={`min-w-0 flex-1 truncate text-sm font-medium ${tw.text.primary}`}
                >
                  {app.name}
                </div>
                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <IconButton
                    title={t('edit')}
                    onClick={(e) => {
                      e.stopPropagation()
                      store.openEdit(app)
                    }}
                  >
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    title={t('delete')}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleRemove(app)
                    }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </div>
              <div className={`truncate text-xs ${tw.text.tertiary}`}>
                {app.url}
              </div>
              {app.description ? (
                <div
                  className={`mt-1 line-clamp-2 text-xs ${tw.text.secondary}`}
                >
                  {app.description}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

function IconButton({ children, title, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      className={`rounded p-1 ${tw.text.secondary} ${tw.hover}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
