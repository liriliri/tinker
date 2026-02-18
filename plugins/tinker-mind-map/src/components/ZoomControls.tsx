import { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

const ZOOM_PRESET_VALUES = [50, 75, 100, 125, 150, 200]

export default observer(function ZoomControls() {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isDisabled = !store.mindMap
  const buttonBase =
    'h-9 w-9 flex items-center justify-center transition-colors'
  const buttonState = isDisabled ? 'cursor-not-allowed opacity-40' : tw.hover
  const shellBase = `border shadow-md ${tw.bg.primary} ${tw.border}`
  const menuItemBase = 'w-full px-3 py-1 text-sm text-left transition-colors'

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
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
            onClick={() => store.zoomIn()}
            disabled={isDisabled}
            title={t('zoomIn')}
            className={`${buttonBase} ${buttonState}`}
          >
            <ZoomIn size={TOOLBAR_ICON_SIZE} />
          </button>
          <button
            type="button"
            disabled={isDisabled}
            onMouseEnter={() => {
              if (!isDisabled) setIsMenuOpen(true)
            }}
            className={`h-9 px-3 flex items-center justify-center text-[15px] font-medium text-center tabular-nums min-w-[56px] ${tw.text.primary} ${buttonState}`}
          >
            {store.scale}%
          </button>
          <button
            type="button"
            onClick={() => store.zoomOut()}
            disabled={isDisabled}
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
            {ZOOM_PRESET_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  store.setZoom(value)
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
        onClick={() => store.fit()}
        disabled={isDisabled}
        title={t('fit')}
        className={`h-9 w-9 rounded-full transition-colors ${shellBase} ${buttonState}`}
      >
        <Maximize size={TOOLBAR_ICON_SIZE} className="mx-auto" />
      </button>
    </div>
  )
})
