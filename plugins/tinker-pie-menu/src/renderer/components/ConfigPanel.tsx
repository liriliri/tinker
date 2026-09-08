import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder, Globe, Monitor, Package, Terminal } from 'lucide-react'
import Switch from 'share/components/Switch'
import { Toolbar, ToolbarSpacer } from 'share/components/Toolbar'
import { tw } from 'share/theme'
import type { ActionType } from '../types'
import store from '../store'
import ActionForm from './ActionForm'

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

export default observer(function ConfigPanel() {
  const { t } = useTranslation()
  const action = store.selectedAction
  const showEditor = !!action || store.isAdding

  return (
    <div className="h-full flex flex-col">
      {action && (
        <Toolbar>
          <ToolbarSpacer />
          <Switch
            checked={action.enabled}
            title={action.enabled ? t('disable') : t('enable')}
            onChange={() => void store.toggleSlotEnabled(store.selectedSlot)}
          />
        </Toolbar>
      )}

      <div className="flex-1 min-h-0 p-3 flex flex-col gap-3 overflow-auto">
        {showEditor ? (
          <ActionForm />
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm shadow-sm ${tw.border} ${tw.bg.primary} ${tw.hover} ${tw.text.primary}`}
                  onClick={() => store.openAddForm(type)}
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
