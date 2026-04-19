import { useRef, useCallback, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { X, Loader2, Globe } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import store from '../store'
import type { ITab } from '../../common/types'

const DRAG_THRESHOLD = 5

interface TabProps {
  tab: ITab
  isFirst: boolean
  showSeparator: boolean
}

export default observer(function Tab({
  tab,
  isFirst,
  showSeparator,
}: TabProps) {
  const { t } = useTranslation()
  const isActive = store.activeTabId === tab.id
  const tabRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{
    startX: number
    started: boolean
    offsetX: number
    tabWidth: number
  } | null>(null)

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    store.closeTab(tab.id)
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()

      store.setActiveTab(tab.id)

      const el = tabRef.current
      if (!el) return

      dragState.current = {
        startX: e.clientX,
        started: false,
        offsetX: 0,
        tabWidth: el.offsetWidth,
      }

      const onMouseMove = (ev: MouseEvent) => {
        const state = dragState.current
        if (!state) return

        const dx = ev.clientX - state.startX
        if (!state.started && Math.abs(dx) < DRAG_THRESHOLD) return

        if (!state.started) {
          state.started = true
          el.style.zIndex = '10'
          el.style.opacity = '0.85'
          el.style.transition = 'none'
          el.style.pointerEvents = 'none'
        }

        state.offsetX = dx
        el.style.transform = `translateX(${dx}px)`

        // Determine if we should swap
        const currentIndex = store.tabs.findIndex((t) => t.id === tab.id)
        if (currentIndex === -1) return

        const parent = el.parentElement
        if (!parent) return

        const children = Array.from(parent.children) as HTMLElement[]
        const tabElements = children.filter((c) =>
          c.hasAttribute('data-tab-id')
        )

        if (dx > 0) {
          // Moving right
          const nextIndex = currentIndex + 1
          if (nextIndex < store.tabs.length) {
            const nextEl = tabElements[nextIndex]
            if (nextEl) {
              const nextCenter = nextEl.offsetLeft + nextEl.offsetWidth / 2
              const currentRight = el.offsetLeft + el.offsetWidth + dx
              if (currentRight >= nextCenter) {
                store.moveTab(currentIndex, nextIndex)
                state.startX += nextEl.offsetWidth
                state.offsetX = ev.clientX - state.startX
                el.style.transform = `translateX(${state.offsetX}px)`
              }
            }
          }
        } else {
          // Moving left
          const prevIndex = currentIndex - 1
          if (prevIndex >= 0) {
            const prevEl = tabElements[prevIndex]
            if (prevEl) {
              const prevCenter = prevEl.offsetLeft + prevEl.offsetWidth / 2
              const currentLeft = el.offsetLeft + dx
              if (currentLeft <= prevCenter) {
                store.moveTab(currentIndex, prevIndex)
                state.startX -= prevEl.offsetWidth
                state.offsetX = ev.clientX - state.startX
                el.style.transform = `translateX(${state.offsetX}px)`
              }
            }
          }
        }
      }

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)

        if (dragState.current?.started) {
          el.style.transition = 'transform 200ms ease-out'
          el.style.transform = 'translateX(0px)'
          el.style.opacity = ''
          el.style.pointerEvents = ''

          const cleanup = () => {
            el.style.transition = ''
            el.style.zIndex = ''
            el.style.transform = ''
            el.removeEventListener('transitionend', cleanup)
          }
          el.addEventListener('transitionend', cleanup)
        }

        dragState.current = null
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [tab.id]
  )

  useEffect(() => {
    return () => {
      // Cleanup if unmounted during drag
      dragState.current = null
    }
  }, [])

  return (
    <div
      ref={tabRef}
      data-tab-id={tab.id}
      className={`group relative flex items-center h-full max-w-[240px] min-w-[72px] cursor-pointer transition-colors duration-100 select-none ${
        isActive
          ? `${tw.bg.secondary} z-[2]`
          : `${tw.bg.tertiary} hover:bg-black/[0.06] dark:hover:bg-white/[0.08] z-[1]`
      }`}
      style={{ flex: '1 1 0', minWidth: '72px' }}
      onMouseDown={handleMouseDown}
    >
      {isActive ? (
        <>
          <div
            className={`pointer-events-none absolute inset-0 border-x border-t ${
              tw.border
            } ${isFirst ? 'border-l-transparent' : ''}`}
          />
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px ${tw.bg.secondary}`}
          />
        </>
      ) : (
        <div
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
        />
      )}
      {/* Separator: always in DOM, visibility toggled */}
      <div
        className={`absolute -right-px top-1/4 bottom-1/4 w-px z-[3] ${
          tw.bg.border
        } ${showSeparator ? 'visible' : 'invisible'}`}
      />
      <div className="flex items-center overflow-hidden flex-1 min-w-0 ml-2.5">
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {tab.isLoading ? (
            <Loader2 size={14} className={`animate-spin ${tw.text.tertiary}`} />
          ) : tab.favicon ? (
            <img src={tab.favicon} className="w-4 h-4" alt="" />
          ) : (
            <Globe size={14} className={tw.text.tertiary} />
          )}
        </div>
        <span
          className={`text-xs truncate flex-1 min-w-0 ml-2.5 ${
            isActive ? tw.text.primary : tw.text.secondary
          }`}
        >
          {tab.title || (tab.url ? tab.url : t('newTab'))}
        </span>
      </div>
      <button
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full mr-1.5 transition-all duration-100 opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/10 ${
          isActive ? '!opacity-70' : ''
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleClose}
      >
        <X size={14} className={tw.text.secondary} />
      </button>
    </div>
  )
})
