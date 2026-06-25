import { observer } from 'mobx-react-lite'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { PHOTO_FILTERS } from '../lib/filters'
import store from '../store'

const THUMB_SIZE = 72

const FilterBar = observer(function FilterBar() {
  const { t } = useTranslation()
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [overflow, setOverflow] = useState(false)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const previewKeyRef = useRef('')

  const imageKey = store.image
    ? `${store.image.fileName}:${store.image.width}x${store.image.height}`
    : ''
  const previewReady = store.hasImage && !store.isLoading

  useEffect(() => {
    if (!previewReady || !imageKey) {
      setPreviews({})
      previewKeyRef.current = ''
      return
    }

    if (previewKeyRef.current === imageKey) return

    let cancelled = false
    const initial: Record<string, string> = {}

    for (const filter of PHOTO_FILTERS) {
      const cached = store.getFilterPreview(filter.id)
      if (cached) initial[filter.id] = cached
    }

    setPreviews(initial)

    void store
      .generateAllFilterPreviews(THUMB_SIZE, (filterId, url) => {
        if (cancelled) return
        setPreviews((current) => ({ ...current, [filterId]: url }))
      })
      .then(() => {
        if (!cancelled) previewKeyRef.current = imageKey
      })

    return () => {
      cancelled = true
    }
  }, [imageKey, previewReady])

  useEffect(() => {
    const el = scrollRoot
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      el.scrollLeft += event.deltaY
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [scrollRoot])

  useLayoutEffect(() => {
    const el = scrollRoot
    if (!el) return

    const check = () => {
      setOverflow(el.scrollWidth > el.clientWidth)
    }

    const ro = new ResizeObserver(check)
    ro.observe(el)
    check()
    return () => ro.disconnect()
  }, [scrollRoot, previews])

  useEffect(() => {
    const activeId = store.activeFilterId ?? 'original'
    itemRefs.current[activeId]?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [store.activeFilterId])

  const setItemRef = useCallback(
    (filterId: string, node: HTMLButtonElement | null) => {
      itemRefs.current[filterId] = node
    },
    []
  )

  if (!store.hasImage) return null

  return (
    <div
      className={`shrink-0 border-t ${tw.border} ${tw.bg.tertiary}`}
      aria-label={t('filters')}
    >
      <div
        ref={setScrollRoot}
        className={`scrollbar-hide flex gap-2 overflow-x-auto px-3 py-2 ${
          overflow ? '' : 'justify-center'
        }`}
      >
        {PHOTO_FILTERS.map((filter) => {
          const isActive =
            filter.id === 'original'
              ? store.activeFilterId === null && !store.hasAdjustments
              : store.activeFilterId === filter.id
          const preview = previews[filter.id]

          return (
            <button
              key={filter.id}
              ref={(node) => setItemRef(filter.id, node)}
              type="button"
              className={`flex w-[76px] shrink-0 flex-col items-center gap-1 rounded-md p-1 transition-colors ${tw.text.secondary} ${tw.hover}`}
              onClick={() => store.applyFilter(filter.id)}
              title={t(filter.nameKey)}
            >
              <span
                className={`block h-[72px] w-[72px] overflow-hidden rounded border-2 ${
                  isActive ? tw.primary.border : tw.border
                } ${tw.bg.primary}`}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px]">
                    …
                  </span>
                )}
              </span>
              <span
                className={`w-full truncate text-center text-[11px] leading-tight ${
                  isActive ? tw.primary.text : tw.text.secondary
                }`}
              >
                {t(filter.nameKey)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
})

export default FilterBar
