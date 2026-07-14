import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import className from 'licia/className'
import { TOOLBAR_ICON_SIZE } from './Toolbar'
import { tw } from '../theme'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'zoomControls'

addI18nNamespace(I18N_NS, {
  'en-US': {
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    zoomFit: 'Fit',
  },
  'zh-CN': {
    zoomIn: '放大',
    zoomOut: '缩小',
    zoomFit: '适应',
  },
})

const DEFAULT_PRESETS = [50, 100, 150, 200]

export interface ZoomControlsProps {
  scale: number
  disabled?: boolean
  presets?: number[]
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
  onZoomToPercent: (percent: number) => void
  className?: string
}

export default function ZoomControls({
  scale,
  disabled = false,
  presets = DEFAULT_PRESETS,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomToPercent,
  className: extraClassName = '',
}: ZoomControlsProps) {
  const { t } = useTranslation(I18N_NS)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const buttonBase =
    'h-9 w-9 flex items-center justify-center transition-colors'
  const buttonState = disabled ? 'cursor-not-allowed opacity-40' : tw.hover
  const shellBase = `border shadow-md ${tw.bg.primary} ${tw.border}`
  const menuItemBase = 'w-full px-3 py-1 text-sm text-left transition-colors'

  return (
    <div
      className={className(
        'absolute bottom-4 right-4 z-10 flex items-center gap-2',
        extraClassName
      )}
    >
      <div
        ref={menuRef}
        className="relative pb-0.5"
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <div
          className={`flex items-center overflow-hidden rounded-full ${shellBase}`}
        >
          <button
            type="button"
            onClick={onZoomIn}
            disabled={disabled}
            title={t('zoomIn')}
            className={`${buttonBase} ${buttonState}`}
          >
            <ZoomIn size={TOOLBAR_ICON_SIZE} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onMouseEnter={() => {
              if (!disabled) setIsMenuOpen(true)
            }}
            className={`h-9 px-3 flex items-center justify-center text-[15px] font-medium text-center tabular-nums min-w-[56px] ${tw.text.primary} ${buttonState}`}
          >
            {scale}%
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            disabled={disabled}
            title={t('zoomOut')}
            className={`${buttonBase} ${buttonState}`}
          >
            <ZoomOut size={TOOLBAR_ICON_SIZE} />
          </button>
        </div>
        {isMenuOpen && (
          <div
            className={`absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 rounded-md border shadow-md py-0 overflow-hidden ${tw.bg.primary} ${tw.border}`}
          >
            {presets.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onZoomToPercent(value)
                  setIsMenuOpen(false)
                }}
                className={`${menuItemBase} ${tw.hover}`}
              >
                {value}%
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onZoomFit}
        disabled={disabled}
        title={t('zoomFit')}
        className={`h-9 w-9 rounded-full transition-colors ${shellBase} ${buttonState}`}
      >
        <Maximize size={TOOLBAR_ICON_SIZE} className="mx-auto" />
      </button>
    </div>
  )
}
