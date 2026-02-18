import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Search, Cpu, HardDrive, Network } from 'lucide-react'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar className="!border-b-0">
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

      <div className="relative w-48 ml-1">
        <Search
          size={14}
          className={className(
            'absolute left-2 top-1/2 -translate-y-1/2',
            tw.text.tertiary
          )}
        />
        <ToolbarTextInput
          value={store.searchKeyword}
          onChange={(e) => store.setSearchKeyword(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={className(
            'w-full pl-7 pr-2 py-1',
            tw.bg.input,
            `placeholder:${tw.text.tertiary}`,
            `dark:placeholder:${tw.text.tertiary}`
          )}
        />
      </div>

      <ToolbarSpacer />

      <div className={`text-xs ${tw.text.secondary} mr-1`}>
        {t('totalProcesses', { count: store.filteredProcesses.length })}
      </div>
    </Toolbar>
  )
})
