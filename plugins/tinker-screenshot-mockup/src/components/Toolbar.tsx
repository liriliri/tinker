import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Copy, Plus, Trash2 } from 'lucide-react'
import Select from 'share/components/Select'
import {
  Toolbar as ToolbarBar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import { canvasPresets } from '../lib/presets'
import CanvasSizeDialog from './CanvasSizeDialog'
import find from 'licia/find'
import map from 'licia/map'

const CUSTOM = '__custom__'

function canvasPresetOptions(presetName: string, customLabel: string) {
  const options = map(canvasPresets, (p) => ({
    label: `${p.name} (${p.width}×${p.height})`,
    value: p.name,
  }))
  if (!presetName) {
    options.push({ label: customLabel, value: CUSTOM })
  }
  return options
}

const Toolbar = observer(function Toolbar() {
  const { t } = useTranslation()
  const [showSizeDialog, setShowSizeDialog] = useState(false)

  const presetValue = store.canvasSize.presetName || CUSTOM
  const presetOptions = canvasPresetOptions(
    store.canvasSize.presetName,
    t('customSize')
  )

  const handlePresetChange = (value: string) => {
    if (value === CUSTOM) return
    const preset = find(canvasPresets, (p) => p.name === value)
    if (!preset) return
    store.setCanvasSize({
      width: preset.width,
      height: preset.height,
      presetName: preset.name,
    })
  }

  const handleCustomSize = (width: number, height: number) => {
    store.setCanvasSize({ width, height, presetName: '' })
  }

  return (
    <ToolbarBar>
      <ToolbarButton title={t('addDevice')} onClick={() => store.addObject()}>
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        title={t('duplicate')}
        disabled={!store.selectedObject}
        onClick={() => {
          const id = store.selectedObjectId
          if (id) store.duplicateObject(id)
        }}
      >
        <Copy size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        title={t('remove')}
        disabled={!store.selectedObject || store.sceneObjects.length <= 1}
        onClick={() => {
          const id = store.selectedObjectId
          if (id) store.removeObject(id)
        }}
      >
        <Trash2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarButton
        onClick={() => setShowSizeDialog(true)}
        title={t('setCanvasSize')}
      >
        {store.canvasSize.width} × {store.canvasSize.height}
      </ToolbarButton>
      <Select
        value={presetValue}
        onChange={handlePresetChange}
        options={presetOptions}
        title={t('canvasPreset')}
      />
      <ToolbarTextButton
        variant={store.isExporting ? 'secondary' : 'primary'}
        disabled={store.isExporting}
        onClick={() => store.exportImage()}
      >
        {store.isExporting ? t('exporting') : t('export')}
      </ToolbarTextButton>
      <CanvasSizeDialog
        open={showSizeDialog}
        onClose={() => setShowSizeDialog(false)}
        onConfirm={handleCustomSize}
        currentWidth={store.canvasSize.width}
        currentHeight={store.canvasSize.height}
      />
    </ToolbarBar>
  )
})

export default Toolbar
