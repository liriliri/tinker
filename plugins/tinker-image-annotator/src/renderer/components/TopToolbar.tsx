import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Save,
  Trash2,
  RotateCcw,
  PenLine,
  Type,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { tw } from 'share/theme'
import store, { ToolType } from '../store'

interface TopToolbarProps {
  onOpenImage: () => void
}

const TOOL_DEFS: Array<{ id: ToolType; icon: LucideIcon; labelKey: string }> = [
  { id: 'pen', icon: PenLine, labelKey: 'pen' },
  { id: 'text', icon: Type, labelKey: 'text' },
]

export default observer(function TopToolbar({ onOpenImage }: TopToolbarProps) {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <ToolbarButton onClick={onOpenImage} title={t('open')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.saveToFile()}
        disabled={!store.hasImage}
        title={t('save')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.deleteSelected()}
        disabled={!store.hasImage}
        title={t('delete')}
      >
        <Trash2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.clearAnnotations()}
        disabled={!store.hasImage}
        title={t('clear')}
      >
        <RotateCcw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      {TOOL_DEFS.map((tool) => {
        const Icon = tool.icon
        return (
          <ToolbarButton
            key={tool.id}
            variant="toggle"
            active={store.tool === tool.id}
            onClick={() => store.setTool(tool.id)}
            disabled={!store.hasImage}
            title={t(tool.labelKey)}
          >
            <Icon size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        )
      })}
      <ToolbarSeparator />
      <ToolbarButton
        onClick={() => store.zoomOut()}
        disabled={!store.hasImage}
        title={t('zoomOut')}
      >
        <ZoomOut size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.zoomIn()}
        disabled={!store.hasImage}
        title={t('zoomIn')}
      >
        <ZoomIn size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.zoomFit()}
        disabled={!store.hasImage}
        title={t('zoomFit')}
      >
        <Maximize2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <div className={`text-xs px-2 ${tw.text.both.secondary}`}>
        {store.scale}%
      </div>
      <ToolbarSpacer />
    </Toolbar>
  )
})
