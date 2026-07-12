import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Checkbox from 'share/components/Checkbox'
import Select from 'share/components/Select'
import { AdjustmentSlider } from 'share/components/Slider'
import { tw } from 'share/theme'
import store from '../store'
import {
  ASCII_CHARSET_OPTIONS,
  CELL_SIZE_RANGE,
  CONTRAST_RANGE,
  DETAIL_RANGE,
  PIXEL_SIZE_RANGE,
  type AsciiCharset,
} from '../types'

const EffectParams = observer(function EffectParams() {
  const { t, i18n } = useTranslation()

  const charsetOptions = useMemo(
    () =>
      ASCII_CHARSET_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t, i18n.language]
  )

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
    return (
      <AdjustmentSlider
        label={t('pixelSize')}
        value={store.params.pixelate.pixelSize}
        min={PIXEL_SIZE_RANGE.min}
        max={PIXEL_SIZE_RANGE.max}
        step={PIXEL_SIZE_RANGE.step}
        defaultValue={PIXEL_SIZE_RANGE.default}
        onChange={(value) => store.setPixelateParam('pixelSize', value)}
      />
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
      <div className="mb-3">
        <div className={`mb-2 text-sm select-none ${tw.text.primary}`}>
          {t('charset')}
        </div>
        <Select<AsciiCharset>
          className="w-full"
          value={store.params.ascii.charset}
          onChange={(value) => store.setAsciiParam('charset', value)}
          options={charsetOptions}
        />
      </div>
      <Checkbox
        checked={store.params.ascii.invert}
        onChange={(checked) => store.setAsciiParam('invert', checked)}
      >
        {t('invert')}
      </Checkbox>
    </>
  )
})

export default EffectParams
