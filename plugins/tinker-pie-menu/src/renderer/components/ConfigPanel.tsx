import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Play, Trash2 } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import Switch from 'share/components/Switch'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import type { ActionType } from '../types'
import store from '../store'
import ActionForm from './ActionForm'
import { ACTION_TYPE_ICONS } from './ActionTypeIcon'

const TYPE_BUTTONS: { type: ActionType; labelKey: string }[] = [
  { type: 'command', labelKey: 'command' },
  { type: 'app', labelKey: 'application' },
  { type: 'directory', labelKey: 'directory' },
  { type: 'url', labelKey: 'url' },
  { type: 'plugin', labelKey: 'plugin' },
]

export default observer(function ConfigPanel() {
  const { t } = useTranslation()
  const action = store.selectedAction

  function slotName() {
    if (action?.name) return action.name
    const index = store.selectedSlot + 1
    return store.selectedRing === 'outer'
      ? t('outerSlotLabel', { index })
      : t('slotLabel', { index })
  }

  async function handleClear() {
    if (!action) return
    const ok = await confirm({
      title: t('deleteConfirm', { name: slotName() }),
    })
    if (ok) {
      store.clearSlot(store.selectedSlot)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {action && (
        <Toolbar>
          <Switch
            checked={action.enabled}
            title={action.enabled ? t('disable') : t('enable')}
            onChange={() => store.toggleSlotEnabled(store.selectedSlot)}
          />
          <ToolbarSpacer />
          <ToolbarButton title={t('delete')} onClick={() => void handleClear()}>
            <Trash2 size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton
            title={t('run')}
            onClick={() =>
              void store.runSlot(store.selectedSlot, store.selectedRing)
            }
          >
            <Play size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </Toolbar>
      )}

      <div className="flex-1 min-h-0 p-3 overflow-hidden flex flex-col">
        {action ? (
          <ActionForm />
        ) : (
          <div className="h-full min-h-0 overflow-y-auto flex items-center justify-center">
            <div className="w-full grid grid-cols-1 gap-1.5">
              {TYPE_BUTTONS.map(({ type, labelKey }) => {
                const Icon = ACTION_TYPE_ICONS[type]
                return (
                  <button
                    key={type}
                    type="button"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm shadow-sm ${tw.border} ${tw.bg.primary} ${tw.hover} ${tw.text.primary}`}
                    onClick={() => store.addSlot(type)}
                  >
                    <Icon size={14} className={tw.text.secondary} />
                    {t(labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
