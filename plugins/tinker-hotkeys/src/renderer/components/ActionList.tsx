import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { confirm } from 'share/components/Confirm'
import { tw } from 'share/theme'
import fileUrl from 'licia/fileUrl'
import isEmpty from 'licia/isEmpty'
import {
  Keyboard,
  Play,
  Pencil,
  Trash2,
  AlertTriangle,
  Terminal,
  Monitor,
  Folder,
  Globe,
  Package,
} from 'lucide-react'
import type { Action } from '../types'
import { actionUsesIcon } from '../lib/util'
import store from '../store'

interface ActionProps {
  action: Action
}

function ActionIcon({ action }: ActionProps) {
  if (actionUsesIcon(action.type) && action.appIcon) {
    return (
      <img
        src={fileUrl(action.appIcon)}
        alt=""
        className="w-4 h-4 rounded shrink-0"
      />
    )
  }
  if (action.type === 'app') {
    return <Monitor size={14} className={`shrink-0 ${tw.text.tertiary}`} />
  }
  if (action.type === 'plugin') {
    return <Package size={14} className={`shrink-0 ${tw.text.tertiary}`} />
  }
  if (action.type === 'directory') {
    return <Folder size={14} className={`shrink-0 ${tw.text.tertiary}`} />
  }
  if (action.type === 'url') {
    return <Globe size={14} className={`shrink-0 ${tw.text.tertiary}`} />
  }
  return <Terminal size={14} className={`shrink-0 ${tw.text.tertiary}`} />
}

const ActionRow = observer(function ActionRow({ action }: ActionProps) {
  const { t } = useTranslation()
  const unbound = store.isUnbound(action.id)

  async function handleDelete() {
    const ok = await confirm({
      title: t('deleteConfirm', { name: action.name }),
    })
    if (ok) {
      await store.removeAction(action.id)
    }
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md border ${
        tw.border
      } ${tw.bg.secondary} ${action.enabled ? '' : 'opacity-50'}`}
    >
      <button
        type="button"
        className={`shrink-0 w-8 h-8 rounded flex items-center justify-center ${tw.hover}`}
        title={action.enabled ? t('disable') : t('enable')}
        onClick={() => void store.toggleEnabled(action.id)}
      >
        <span
          className={`w-3 h-3 rounded-full border-2 transition-colors ${
            action.enabled
              ? `${tw.primary.border} ${tw.primary.bg}`
              : 'border-gray-400 dark:border-gray-500'
          }`}
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ActionIcon action={action} />
          <span className={`text-sm font-medium truncate ${tw.text.primary}`}>
            {action.name}
          </span>
          {unbound && (
            <span
              className="inline-flex items-center gap-1 text-amber-500"
              title={t('hotkeyUnbound')}
            >
              <AlertTriangle size={12} />
            </span>
          )}
        </div>
        <div
          className={`flex items-center gap-3 mt-0.5 text-xs ${tw.text.tertiary}`}
        >
          <span className="inline-flex items-center gap-1 shrink-0">
            <Keyboard size={12} />
            <span className="font-mono">{action.hotkey}</span>
          </span>
          <span className="font-mono truncate">{action.command}</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
          title={t('run')}
          onClick={() => void store.runAction(action.id)}
        >
          <Play size={14} />
        </button>
        <button
          type="button"
          className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
          title={t('edit')}
          onClick={() => store.openEditDialog(action)}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
          title={t('delete')}
          onClick={() => void handleDelete()}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
})

interface EmptyStateProps {
  message: string
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center gap-2 ${tw.text.tertiary}`}
    >
      <Keyboard size={40} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default observer(function ActionList() {
  const { t } = useTranslation()
  const actions = store.filteredActions

  if (isEmpty(store.actions)) {
    return <EmptyState message={t('emptyHint')} />
  }

  if (isEmpty(actions)) {
    return <EmptyState message={t('noResults')} />
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <ActionRow key={action.id} action={action} />
      ))}
    </div>
  )
})
