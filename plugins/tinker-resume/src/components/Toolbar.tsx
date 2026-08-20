import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlignJustify, Columns2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarAiButton,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarColor,
  ToolbarLabel,
  ToolbarSpacer,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleExport = async () => {
    try {
      const saved = await store.exportPdf()
      if (saved) toast.success(t('exportSuccess'))
    } catch {
      toast.error(t('exportFailed'))
    }
  }

  return (
    <Toolbar>
      <ToolbarButtonGroup>
        <ToolbarButton
          variant="toggle"
          active={store.templateId === 'classic'}
          onClick={() => store.setTemplateId('classic')}
          title={t('templateClassic')}
          className={`rounded-none rounded-l border-r ${tw.border}`}
        >
          <AlignJustify size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          variant="toggle"
          active={store.templateId === 'sidebar'}
          onClick={() => store.setTemplateId('sidebar')}
          title={t('templateSidebar')}
          className="rounded-none rounded-r"
        >
          <Columns2 size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </ToolbarButtonGroup>
      <div className="flex items-center gap-1.5 px-1">
        <ToolbarLabel>{`${t('themeColor')}:`}</ToolbarLabel>
        <ToolbarColor
          value={store.themeColor}
          onChange={(e) => store.setThemeColor(e.target.value)}
        />
      </div>
      <ToolbarSpacer />
      <ToolbarTextButton
        variant={store.exporting ? 'secondary' : 'primary'}
        onClick={handleExport}
        disabled={store.exporting}
      >
        {t('exportPdf')}
      </ToolbarTextButton>
      {store.hasAI && (
        <ToolbarAiButton
          onClick={() => store.toggleChat()}
          title={t('chatTitle')}
        />
      )}
    </Toolbar>
  )
})
