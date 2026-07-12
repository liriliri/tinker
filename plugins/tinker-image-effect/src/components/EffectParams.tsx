import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AdjustmentSlider } from 'share/components/Slider'
import Switch from 'share/components/Switch'
import { tw } from 'share/theme'
import store from '../store'
import {
  CELL_SIZE_RANGE,
  CONTRAST_RANGE,
  DETAIL_RANGE,
  PIXEL_PALETTE_OPTIONS,
  PIXEL_SIZE_RANGE,
  type PixelPaletteId,
} from '../types'
import PalettePicker from './PalettePicker'

const EffectParams = observer(function EffectParams() {
  const { t, i18n } = useTranslation()

  const paletteLabels = useMemo(() => {
    const labels = {} as Record<PixelPaletteId, string>
    for (const option of PIXEL_PALETTE_OPTIONS) {
      labels[option.value] = t(option.labelKey)
    }
    return labels
  }, [t, i18n.language])

  if (store.effectId === 'sketch') {
    return (
      <>
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
          label={t('contrast')}
          value={store.params.sketch.contrast}
          min={CONTRAST_RANGE.min}
          max={CONTRAST_RANGE.max}
          step={CONTRAST_RANGE.step}
          defaultValue={CONTRAST_RANGE.default}
          onChange={(value) => store.setSketchParam('contrast', value)}
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
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className={`text-sm select-none ${tw.text.primary}`}>
              {t('palette')}
            </div>
            <Switch
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
        <div className="flex items-center justify-between gap-2">
          <div className={`text-sm select-none ${tw.text.primary}`}>
            {t('outline')}
          </div>
          <Switch
            checked={store.params.pixelate.outline}
            onChange={(checked) => store.setPixelateParam('outline', checked)}
          />
        </div>
      </>
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
      <div className="flex items-center justify-between gap-2">
        <div className={`text-sm select-none ${tw.text.primary}`}>
          {t('invert')}
        </div>
        <Switch
          checked={store.params.ascii.invert}
          onChange={(checked) => store.setAsciiParam('invert', checked)}
        />
      </div>
    </>
  )
})

export default EffectParams
