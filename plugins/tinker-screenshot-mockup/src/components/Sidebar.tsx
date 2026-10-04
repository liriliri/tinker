import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ArrowLeftRight, Square, Columns2, Monitor } from 'lucide-react'
import className from 'licia/className'
import { tw } from 'share/theme'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import Slider from 'share/components/Slider'
import Switch from 'share/components/Switch'
import store from '../store'
import { gradientCss, gradientPresets } from '../lib/gradients'
import type { DeviceCategory } from '../types'
import AngleDial from './AngleDial'

const DEVICE_OPTIONS: { id: DeviceCategory; icon: typeof Square }[] = [
  { id: 'phone', icon: Square },
  { id: 'tablet', icon: Columns2 },
  { id: 'pc', icon: Monitor },
]

const DEVICE_LABEL_KEYS: Record<DeviceCategory, string> = {
  phone: 'categoryPhone',
  tablet: 'categoryTablet',
  pc: 'categoryPc',
}

const ANGLE_PRESETS = [0, 45, 90, 135, 180]
const BG_TYPES = ['gradient', 'solid', 'image'] as const
const BG_TYPE_LABEL: Record<(typeof BG_TYPES)[number], string> = {
  gradient: 'bgGradient',
  solid: 'bgSolid',
  image: 'bgImage',
}
const TAB_ON = [tw.primary.bg, 'text-white']
const TAB_OFF = [tw.bg.secondary, tw.text.secondary, tw.hover]

interface ColorSwatchProps {
  value: string
  onChange: (color: string) => void
  round?: boolean
}

function ColorSwatch({ value, onChange, round }: ColorSwatchProps) {
  return (
    <label
      className={className(
        'relative shrink-0 cursor-pointer overflow-hidden border',
        tw.border,
        round ? 'h-10 w-10 rounded-full' : 'h-7 w-12 rounded'
      )}
    >
      <span className="block h-full w-full" style={{ background: value }} />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  )
}

const Sidebar = observer(function Sidebar() {
  const { t } = useTranslation()
  const selected = store.selectedObject

  return (
    <aside
      className={`w-72 shrink-0 h-full flex flex-col overflow-hidden border-l ${tw.border} ${tw.bg.tertiary}`}
    >
      <OverlayScrollbars defer className="min-h-0 flex-1">
        <div className="space-y-3 px-4 py-4">
          <div className="flex gap-1">
            {BG_TYPES.map((type) => {
              const active =
                type === 'gradient'
                  ? store.background.type === 'gradient'
                  : type === 'image'
                  ? store.background.type === 'image'
                  : store.background.type === 'solid' ||
                    store.background.type === 'transparent'
              return (
                <button
                  key={type}
                  type="button"
                  className={className(
                    'flex-1 rounded py-1.5 text-[11px]',
                    active ? TAB_ON : TAB_OFF
                  )}
                  onClick={() => {
                    if (type === 'image') {
                      if (store.background.type === 'image') return
                      if (!store.background.imageUrl) {
                        store.openBackgroundImageDialog()
                        return
                      }
                      store.setBackgroundType('image')
                      return
                    }
                    if (type === 'solid') {
                      if (store.background.type === 'transparent') return
                      store.setBackgroundType('solid')
                      return
                    }
                    store.setBackgroundType('gradient')
                  }}
                >
                  {t(BG_TYPE_LABEL[type])}
                </button>
              )
            })}
          </div>

          {(store.background.type === 'solid' ||
            store.background.type === 'transparent') && (
            <>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs shrink-0 whitespace-nowrap ${tw.text.primary}`}
                >
                  {t('color')}
                </span>
                <ColorSwatch
                  value={store.background.solidColor}
                  onChange={(color) => store.setSolidColor(color)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${tw.text.primary}`}>
                  {t('bgTransparent')}
                </span>
                <Switch
                  checked={store.background.type === 'transparent'}
                  onChange={(checked) =>
                    store.setBackgroundType(checked ? 'transparent' : 'solid')
                  }
                />
              </div>
            </>
          )}

          {store.background.type === 'gradient' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <ColorSwatch
                  round
                  value={
                    store.background.gradientColors[0] ??
                    gradientPresets[0].colors[0]
                  }
                  onChange={(color) => store.setGradientColor(0, color)}
                />
                <button
                  type="button"
                  title={t('swapColors')}
                  className={className(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    tw.bg.secondary,
                    tw.text.secondary,
                    tw.hover
                  )}
                  onClick={() => store.swapGradientColors()}
                >
                  <ArrowLeftRight size={14} />
                </button>
                <ColorSwatch
                  round
                  value={
                    store.background.gradientColors[1] ??
                    gradientPresets[0].colors[1]
                  }
                  onChange={(color) => store.setGradientColor(1, color)}
                />
              </div>

              <div className="flex items-center gap-3">
                <AngleDial
                  value={store.background.gradientAngle}
                  onChange={(angle) => store.setGradientAngle(angle)}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${tw.text.primary}`}>
                      {t('gradientAngle')}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${tw.text.secondary}`}
                    >
                      {store.background.gradientAngle}°
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={359}
                    value={store.background.gradientAngle}
                    onChange={(angle) => store.setGradientAngle(angle)}
                  />
                  <div className="flex gap-1">
                    {ANGLE_PRESETS.map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        className={className(
                          'flex-1 rounded py-0.5 text-[10px]',
                          store.background.gradientAngle === deg
                            ? TAB_ON
                            : TAB_OFF
                        )}
                        onClick={() => store.setGradientAngle(deg)}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {gradientPresets.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    title={g.name}
                    className={className(
                      'h-10 rounded border-2',
                      store.background.gradientName === g.name
                        ? tw.primary.border
                        : 'border-transparent'
                    )}
                    style={{ background: gradientCss(g.angle, g.colors) }}
                    onClick={() => store.setGradient(g)}
                  />
                ))}
              </div>
            </div>
          )}

          {store.background.type === 'image' && (
            <button
              type="button"
              className={className(
                'w-full rounded-md border border-dashed py-6 text-xs overflow-hidden',
                tw.border,
                tw.text.tertiary,
                tw.hover
              )}
              onClick={() => store.openBackgroundImageDialog()}
            >
              {store.background.imageUrl
                ? t('changeBackground')
                : t('dropBackground')}
            </button>
          )}

          {selected && (
            <>
              <div className={`border-t ${tw.border}`} />

              <button
                type="button"
                className={className(
                  'w-full rounded-md border border-dashed py-6 text-xs',
                  tw.border,
                  tw.text.tertiary,
                  tw.hover
                )}
                onClick={() => store.openScreenshotDialog()}
              >
                {selected.screenshotUrl
                  ? t('changeScreenshot')
                  : t('dropScreenshot')}
              </button>

              <div className="flex gap-1">
                {DEVICE_OPTIONS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    title={t(DEVICE_LABEL_KEYS[id])}
                    className={className(
                      'flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded text-[10px]',
                      selected.deviceId === id ? TAB_ON : TAB_OFF
                    )}
                    onClick={() => store.setObjectDevice(selected.id, id)}
                  >
                    <Icon size={14} />
                    {t(DEVICE_LABEL_KEYS[id])}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs ${tw.text.primary}`}>
                  {t('showFrame')}
                </span>
                <Switch
                  checked={selected.frameStyle === 'default'}
                  onChange={(checked) =>
                    store.setFrameStyle(
                      selected.id,
                      checked ? 'default' : 'none'
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs ${tw.text.primary}`}>
                  {t('shadow')}
                </span>
                <Switch
                  checked={selected.shadow.enabled}
                  onChange={(checked) =>
                    store.setShadowEnabled(selected.id, checked)
                  }
                />
              </div>
            </>
          )}
        </div>
      </OverlayScrollbars>
    </aside>
  )
})

export default Sidebar
