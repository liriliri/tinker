import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <ToolbarButton onClick={() => store.openCreate()} title={t('add')}>
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <span className={`px-2 text-xs ${tw.text.tertiary}`}>
        {t('count', { count: store.apps.length })}
      </span>
    </Toolbar>
  )
})
