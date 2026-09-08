import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Folder,
  Globe,
  Monitor,
  Package,
  Pencil,
  Play,
  Terminal,
  Trash2,
} from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import { tw } from 'share/theme'
import type { ActionType, InvokeMode } from '../types'
import store from '../store'

const TYPE_BUTTONS: {
  type: ActionType
  labelKey: string
  Icon: typeof Terminal
}[] = [
  { type: 'command', labelKey: 'command', Icon: Terminal },
  { type: 'app', labelKey: 'application', Icon: Monitor },
  { type: 'directory', labelKey: 'directory', Icon: Folder },
  { type: 'url', labelKey: 'url', Icon: Globe },
  { type: 'plugin', labelKey: 'plugin', Icon: Package },
]

const MODES: { mode: InvokeMode; labelKey: string; hintKey: string }[] = [
  { mode: 'alwaysOn', labelKey: 'modeAlwaysOn', hintKey: 'modeAlwaysOnHint' },
  {
    mode: 'middleClick',
    labelKey: 'modeMiddleClick',
    hintKey: 'modeMiddleClickHint',
  },
]

export default observer(function ConfigPanel() {
  const { t } = useTranslation()
  const action = store.selectedAction

  async function handleClear() {
    const name =
      action?.name || t('slotLabel', { index: store.selectedSlot + 1 })
    const ok = await confirm({
      title: t('deleteConfirm', { name }),
    })
    if (ok) {
      await store.clearSlot(store.selectedSlot)
    }
  }

  return (
    <div className={`h-full flex flex-col ${tw.bg.primary}`}>
      <div className={`p-4 border-b ${tw.border}`}>
        <p className={`text-sm font-medium mb-2 ${tw.text.secondary}`}>
          {t('invokeMode')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(({ mode, labelKey, hintKey }) => {
            const active = store.invokeMode === mode
            return (
              <button
                key={mode}
                type="button"
                className={`text-left px-3 py-2 rounded-md border transition-colors ${
                  active
                    ? `${tw.primary.border} ${tw.primary.bgFocused}`
                    : `${tw.border} ${tw.hover}`
                }`}
                onClick={() => store.setInvokeMode(mode)}
              >
                <div className={`text-sm font-medium ${tw.text.primary}`}>
                  {t(labelKey)}
                </div>
                <div className={`text-[11px] mt-0.5 ${tw.text.tertiary}`}>
                  {t(hintKey)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4 flex flex-col gap-3 overflow-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-sm font-semibold ${tw.text.primary}`}>
            {t('slotLabel', { index: store.selectedSlot + 1 })}
          </h2>
          {action && (
            <button
              type="button"
              className={`text-xs px-2 py-1 rounded ${tw.hover} ${tw.text.secondary}`}
              onClick={() => void store.toggleSlotEnabled(store.selectedSlot)}
            >
              {action.enabled ? t('disable') : t('enable')}
            </button>
          )}
        </div>

        {action ? (
          <div
            className={`rounded-md border p-3 flex flex-col gap-2 ${
              tw.border
            } ${tw.bg.secondary} ${action.enabled ? '' : 'opacity-50'}`}
          >
            <div className={`text-sm font-medium truncate ${tw.text.primary}`}>
              {action.name}
            </div>
            <div className={`text-xs font-mono truncate ${tw.text.tertiary}`}>
              {action.type}: {action.command}
            </div>
            <div className="flex items-center gap-1 pt-1">
              <button
                type="button"
                className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
                title={t('run')}
                onClick={() => void store.runSlot(store.selectedSlot)}
              >
                <Play size={14} />
              </button>
              <button
                type="button"
                className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
                title={t('edit')}
                onClick={() => store.openEditDialog()}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className={`p-1.5 rounded ${tw.hover} ${tw.text.secondary}`}
                title={t('delete')}
                onClick={() => void handleClear()}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={`text-xs ${tw.text.tertiary}`}>
              {t('emptySlotHint')}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {TYPE_BUTTONS.map(({ type, labelKey, Icon }) => (
                <button
                  key={type}
                  type="button"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${tw.border} ${tw.hover} ${tw.text.primary}`}
                  onClick={() => store.openAddDialog(type)}
                >
                  <Icon size={14} className={tw.text.secondary} />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
})
