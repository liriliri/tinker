import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Cpu, HardDrive, Network } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <ToolbarButton
        variant="toggle"
        active={store.viewMode === 'cpu'}
        onClick={() => store.setViewMode('cpu')}
      >
        <div className="flex items-center gap-1.5">
          <Cpu size={TOOLBAR_ICON_SIZE} />
          <span className="text-xs">{t('cpu')}</span>
        </div>
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={store.viewMode === 'memory'}
        onClick={() => store.setViewMode('memory')}
      >
        <div className="flex items-center gap-1.5">
          <HardDrive size={TOOLBAR_ICON_SIZE} />
          <span className="text-xs">{t('memory')}</span>
        </div>
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={store.viewMode === 'port'}
        onClick={() => store.setViewMode('port')}
      >
        <div className="flex items-center gap-1.5">
          <Network size={TOOLBAR_ICON_SIZE} />
          <span className="text-xs">{t('port')}</span>
        </div>
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarSearch
        value={store.searchKeyword}
        onChange={(value) => store.setSearchKeyword(value)}
        placeholder={t('searchPlaceholder')}
        className="-ml-1"
      />

      <ToolbarSpacer />

      <div className={`text-xs ${tw.text.secondary} mr-1`}>
        {t('totalProcesses', { count: store.filteredProcesses.length })}
      </div>
    </Toolbar>
  )
})
