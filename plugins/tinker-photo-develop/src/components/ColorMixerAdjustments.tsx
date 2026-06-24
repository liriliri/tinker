import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import {
  getMixerEffectiveHue,
  getMixerEffectiveSaturation,
  getMixerSwatchColor,
  getMixerTrackClassName,
} from '../lib/hsl'
import store from '../store'
import {
  COLOR_RANGE,
  MIXER_CHANNELS,
  type MixerAdjustmentKey,
  type MixerChannel,
} from '../types'
import AdjustmentSlider from './AdjustmentSlider'

const MIXER_LABEL_KEYS: Record<MixerChannel, string> = {
  reds: 'mixerReds',
  oranges: 'mixerOranges',
  yellows: 'mixerYellows',
  greens: 'mixerGreens',
  aquas: 'mixerAquas',
  blues: 'mixerBlues',
  purples: 'mixerPurples',
  magentas: 'mixerMagentas',
}

const MIXER_SLIDERS: {
  key: MixerAdjustmentKey
  labelKey: string
}[] = [
  { key: 'hue', labelKey: 'hue' },
  { key: 'saturation', labelKey: 'saturation' },
  { key: 'luminance', labelKey: 'luminance' },
]

const ColorMixerAdjustments = observer(function ColorMixerAdjustments() {
  const { t } = useTranslation()
  const [activeChannel, setActiveChannel] = useState<MixerChannel>('reds')
  const containerRef = useRef<HTMLDivElement>(null)
  const activeAdjustment = store.adjustments.hsl[activeChannel]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const effectiveHue = getMixerEffectiveHue(
      activeChannel,
      activeAdjustment.hue
    )
    const effectiveSaturation = getMixerEffectiveSaturation(
      activeAdjustment.saturation
    )

    container.style.setProperty('--hsl-mixer-hue', String(effectiveHue))
    container.style.setProperty('--hsl-mixer-sat', `${effectiveSaturation}%`)
  }, [activeChannel, activeAdjustment.hue, activeAdjustment.saturation])

  return (
    <div ref={containerRef}>
      <div className="flex justify-between gap-1 mb-4">
        {MIXER_CHANNELS.map((channel) => {
          const selected = activeChannel === channel
          const label = t(MIXER_LABEL_KEYS[channel])

          return (
            <button
              key={channel}
              type="button"
              className={`w-6 h-6 rounded-full transition-all ${
                selected
                  ? `ring-2 ring-offset-1 ring-offset-transparent ${tw.primary.border} scale-110`
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: getMixerSwatchColor(channel) }}
              onClick={() => setActiveChannel(channel)}
              title={label}
              aria-label={label}
            />
          )
        })}
      </div>

      {MIXER_SLIDERS.map(({ key, labelKey }) => (
        <AdjustmentSlider
          key={key}
          label={t(labelKey)}
          value={activeAdjustment[key]}
          min={COLOR_RANGE.min}
          max={COLOR_RANGE.max}
          step={COLOR_RANGE.step}
          defaultValue={COLOR_RANGE.default}
          trackClassName={getMixerTrackClassName(activeChannel, key)}
          onChange={(value) =>
            store.setMixerAdjustment(activeChannel, key, value)
          }
        />
      ))}
    </div>
  )
})

export default ColorMixerAdjustments
