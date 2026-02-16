import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo,
  Redo,
  FileDown,
  PanelLeftClose,
  PanelLeft,
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

  return (
    <Toolbar>
      <ToolbarButton
        onClick={() => store.toggleSidebar()}
        title={t(store.sidebarOpen ? 'hideSidebar' : 'showSidebar')}
      >
        {store.sidebarOpen ? (
          <PanelLeftClose size={TOOLBAR_ICON_SIZE} />
        ) : (
          <PanelLeft size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton onClick={() => store.newFile()} title={t('newFile')}>
        <FilePlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

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

      <Select
        value={store.currentLayout}
        onChange={(value) => store.setLayout(value)}
        options={layoutOptions}
      />

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

      <ToolbarSpacer />

      <ToolbarButton
        onClick={() => store.exportImage()}
        title={t('exportImage')}
      >
        <FileDown size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
