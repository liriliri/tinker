import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  Save,
  Undo,
  Redo,
  Plus,
  Trash2,
  FileDown,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Select from 'share/components/Select'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const layoutOptions = [
    { label: t('layout.logicalStructure'), value: 'logicalStructure' },
    { label: t('layout.mindMap'), value: 'mindMap' },
    {
      label: t('layout.organizationStructure'),
      value: 'organizationStructure',
    },
    { label: t('layout.catalogOrganization'), value: 'catalogOrganization' },
  ]

  const themeOptions = [
    { label: t('theme.default'), value: 'default' },
    { label: t('theme.classic'), value: 'classic' },
    { label: t('theme.minions'), value: 'minions' },
    { label: t('theme.pinkGrape'), value: 'pinkGrape' },
    { label: t('theme.mint'), value: 'mint' },
    { label: t('theme.gold'), value: 'gold' },
    { label: t('theme.vitalityOrange'), value: 'vitalityOrange' },
    { label: t('theme.greenLeaf'), value: 'greenLeaf' },
    { label: t('theme.dark2'), value: 'dark2' },
  ]

  return (
    <Toolbar>
      <ToolbarButton onClick={() => store.openFile()} title={t('openFile')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.saveFile()}
        disabled={!store.hasChanges}
        title={t('saveFile')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.undo()}
        disabled={!store.canUndo}
        title={t('undo')}
      >
        <Undo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.redo()}
        disabled={!store.canRedo}
        title={t('redo')}
      >
        <Redo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.addNode()}
        disabled={!store.hasActiveNode}
        title={t('addNode')}
      >
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.deleteNode()}
        disabled={!store.hasActiveNode}
        title={t('deleteNode')}
      >
        <Trash2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <Select
        value={store.currentLayout}
        onChange={(value) => store.setLayout(value)}
        options={layoutOptions}
      />

      <ToolbarSeparator />

      <Select
        value={store.currentTheme}
        onChange={(value) => store.setTheme(value)}
        options={themeOptions}
      />

      <ToolbarSpacer />

      <ToolbarButton onClick={() => store.zoomIn()} title={t('zoomIn')}>
        <ZoomIn size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={() => store.zoomOut()} title={t('zoomOut')}>
        <ZoomOut size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={() => store.fit()} title={t('fit')}>
        <Maximize size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => store.exportImage()}
        title={t('exportImage')}
      >
        <FileDown size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
