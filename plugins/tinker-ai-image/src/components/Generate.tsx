import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, WandSparkles } from 'lucide-react'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import range from 'licia/range'
import toStr from 'licia/toStr'
import { tw } from 'share/theme'
import store from '../store'
import { IMAGE_COUNT_MAX, IMAGE_COUNT_MIN } from '../types'

export default observer(function Generate() {
  const { t } = useTranslation()
  const countRef = useRef<HTMLButtonElement>(null)
  const disabled = isEmpty(store.providers)
  const canInc = store.count < IMAGE_COUNT_MAX
  const canDec = store.count > IMAGE_COUNT_MIN

  const handleGenerateContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (disabled) return
    const items = map(range(1, 11), (n) => ({
      label: toStr(n),
      click: () => store.enqueueGenerate(n),
    }))
    tinker.showContextMenu(e.clientX, e.clientY, items)
  }

  const handleCountClick = () => {
    if (disabled) return
    const el = countRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const items = map(range(IMAGE_COUNT_MIN, IMAGE_COUNT_MAX + 1), (n) => ({
      label: toStr(n),
      click: () => store.setCount(n),
    }))
    tinker.showContextMenu(rect.left, rect.bottom + 4, items)
  }

  const segmentHover = disabled ? '' : 'hover:bg-black/10'
  const divider = 'border-white/20'

  return (
    <div
      className={`flex w-full h-9 rounded overflow-hidden text-white transition-opacity ${
        tw.primary.bg
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        onClick={() => store.enqueueGenerate(1)}
        onContextMenu={handleGenerateContextMenu}
        disabled={disabled}
        className={`flex-1 h-full text-sm font-medium flex items-center justify-center gap-2 border-r ${divider} disabled:cursor-not-allowed ${segmentHover}`}
      >
        <WandSparkles size={15} />
        {t('generate')}
      </button>
      <div className={`flex flex-col w-7 shrink-0 border-r ${divider}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (canInc) store.setCount(store.count + 1)
          }}
          title={t('count')}
          className={`flex-1 flex items-center justify-center border-b ${divider} disabled:cursor-not-allowed ${segmentHover} ${
            canInc ? '' : 'text-white/35'
          }`}
        >
          <ChevronUp size={12} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (canDec) store.setCount(store.count - 1)
          }}
          title={t('count')}
          className={`flex-1 flex items-center justify-center disabled:cursor-not-allowed ${segmentHover} ${
            canDec ? '' : 'text-white/35'
          }`}
        >
          <ChevronDown size={12} strokeWidth={2.5} />
        </button>
      </div>
      <button
        ref={countRef}
        type="button"
        disabled={disabled}
        onClick={handleCountClick}
        title={t('count')}
        className={`w-9 h-full shrink-0 text-sm font-medium tabular-nums disabled:cursor-not-allowed ${segmentHover}`}
      >
        {store.count}
      </button>
    </div>
  )
})
