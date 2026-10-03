import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import each from 'licia/each'
import { AdjustmentSlider } from 'share/components/Slider'
import Switch from 'share/components/Switch'
import { tw } from 'share/theme'
import store from '../store'
import { CELL_SIZE_RANGE, CONTRAST_RANGE } from '../lib/ascii'
import { PIXEL_SIZE_RANGE } from '../lib/pixelate'
import {
  BRIGHTNESS_RANGE,
  DEEPEN_RANGE,
  DETAIL_RANGE,
  THICKNESS_RANGE,
} from '../lib/sketch'
import { PIXEL_PALETTE_OPTIONS, type PixelPaletteId } from '../types'
import PalettePicker from './PalettePicker'

interface ParamSwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ParamSwitch({ label, checked, onChange }: ParamSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className={`text-sm select-none ${tw.text.primary}`}>{label}</div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

const EffectParams = observer(function EffectParams() {
  const { t, i18n } = useTranslation()

  const paletteLabels = useMemo(() => {
    const labels = {} as Record<PixelPaletteId, string>
    each(PIXEL_PALETTE_OPTIONS, (option) => {
      labels[option.value] = t(option.labelKey)
    })
    return labels
  }, [t, i18n.language])

  if (store.effectId === 'sketch') {
    return (
      <>
        <AdjustmentSlider
          label={t('thickness')}
          value={store.params.sketch.thickness}
          min={THICKNESS_RANGE.min}
          max={THICKNESS_RANGE.max}
          step={THICKNESS_RANGE.step}
          defaultValue={THICKNESS_RANGE.default}
          onChange={(value) => store.setSketchParam('thickness', value)}
        />
        <AdjustmentSlider
          label={t('brightness')}
          value={store.params.sketch.brightness}
          min={BRIGHTNESS_RANGE.min}
          max={BRIGHTNESS_RANGE.max}
          step={BRIGHTNESS_RANGE.step}
          defaultValue={BRIGHTNESS_RANGE.default}
          onChange={(value) => store.setSketchParam('brightness', value)}
        />
        <AdjustmentSlider
          label={t('detail')}
          value={store.params.sketch.detail}
          min={DETAIL_RANGE.min}
          max={DETAIL_RANGE.max}
          step={DETAIL_RANGE.step}
          defaultValue={DETAIL_RANGE.default}
          onChange={(value) => store.setSketchParam('detail', value)}
        />
        <AdjustmentSlider
          label={t('deepen')}
          value={store.params.sketch.deepen}
          min={DEEPEN_RANGE.min}
          max={DEEPEN_RANGE.max}
          step={DEEPEN_RANGE.step}
          defaultValue={DEEPEN_RANGE.default}
          onChange={(value) => store.setSketchParam('deepen', value)}
        />
      </>
    )
  }

  if (store.effectId === 'pixelate') {
    const paletteEnabled = store.params.pixelate.paletteEnabled

    return (
      <>
        <AdjustmentSlider
          label={t('pixelSize')}
          value={store.params.pixelate.pixelSize}
          min={PIXEL_SIZE_RANGE.min}
          max={PIXEL_SIZE_RANGE.max}
          step={PIXEL_SIZE_RANGE.step}
          defaultValue={PIXEL_SIZE_RANGE.default}
          onChange={(value) => store.setPixelateParam('pixelSize', value)}
        />
        <div className="mb-3">
          <div className="mb-2">
            <ParamSwitch
              label={t('palette')}
              checked={paletteEnabled}
              onChange={(checked) =>
                store.setPixelateParam('paletteEnabled', checked)
              }
            />
          </div>
          <PalettePicker
            value={store.params.pixelate.palette}
            onChange={(value) => {
              store.setPixelateParam('palette', value)
              store.setPixelateParam('paletteEnabled', true)
            }}
            labels={paletteLabels}
          />
        </div>
        <ParamSwitch
          label={t('outline')}
          checked={store.params.pixelate.outline}
          onChange={(checked) => store.setPixelateParam('outline', checked)}
        />
      </>
    )
  }

  if (store.effectId === 'ai') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <textarea
          className={`min-h-0 flex-1 w-full resize-none px-2.5 py-1.5 text-sm border rounded ${tw.border} ${tw.bg.input} ${tw.text.primary} ${tw.primary.focusBorder} focus:outline-none focus:ring-1 ${tw.primary.focusRing}`}
          value={store.params.ai.prompt}
          placeholder={t('aiPromptPlaceholder')}
          disabled={store.isAiApplying}
          onChange={(e) => store.setAiParam('prompt', e.target.value)}
        />
        <button
          type="button"
          className={`shrink-0 w-full px-3 py-1.5 text-sm rounded text-white disabled:opacity-50 disabled:cursor-not-allowed ${tw.primary.bg} ${tw.primary.bgHover}`}
          disabled={!store.canApplyAi}
          onClick={() => void store.applyAiEffect()}
        >
          {store.isAiApplying ? t('aiApplying') : t('aiApply')}
        </button>
      </div>
    )
  }

  return (
    <>
      <AdjustmentSlider
        label={t('cellSize')}
        value={store.params.ascii.cellSize}
        min={CELL_SIZE_RANGE.min}
        max={CELL_SIZE_RANGE.max}
        step={CELL_SIZE_RANGE.step}
        defaultValue={CELL_SIZE_RANGE.default}
        onChange={(value) => store.setAsciiParam('cellSize', value)}
      />
      <AdjustmentSlider
        label={t('contrast')}
        value={store.params.ascii.contrast}
        min={CONTRAST_RANGE.min}
        max={CONTRAST_RANGE.max}
        step={CONTRAST_RANGE.step}
        defaultValue={CONTRAST_RANGE.default}
        onChange={(value) => store.setAsciiParam('contrast', value)}
      />
      <ParamSwitch
        label={t('invert')}
        checked={store.params.ascii.invert}
        onChange={(checked) => store.setAsciiParam('invert', checked)}
      />
    </>
  )
})

export default EffectParams
