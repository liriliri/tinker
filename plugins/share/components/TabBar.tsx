import { useRef, useCallback, useEffect, ReactNode } from 'react'
import { X, Loader2, Plus } from 'lucide-react'
import { tw } from 'share/theme'

const DRAG_THRESHOLD = 5

export interface IBaseTab {
  id: string
  title: string
}

export interface TabProps {
  id: string
  title: string
  isActive: boolean
  isFirst: boolean
  hideFirstBorder?: boolean
  icon?: ReactNode
  isLoading?: boolean
  closable?: boolean
  onClose: (id: string) => void
  onActivate: (id: string) => void
  onMove: (fromIndex: number, toIndex: number) => void
  onContextMenu?: (e: React.MouseEvent, id: string) => void
  tabIndex: number
  tabCount: number
}

function Tab({
  id,
  title,
  isActive,
  isFirst,
  hideFirstBorder,
  icon,
  isLoading,
  closable = true,
  onClose,
  onActivate,
  onMove,
  onContextMenu,
  tabCount,
}: TabProps) {
  const tabRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{
    startX: number
    started: boolean
    offsetX: number
    tabWidth: number
  } | null>(null)

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose(id)
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()

      onActivate(id)

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

        const parent = el.parentElement
        if (!parent) return

        const children = Array.from(parent.children) as HTMLElement[]
        const tabElements = children.filter((c) =>
          c.hasAttribute('data-tab-id')
        )

        const currentIndex = tabElements.indexOf(el)
        if (currentIndex === -1) return

        if (dx > 0) {
          const nextIndex = currentIndex + 1
          if (nextIndex < tabCount) {
            const nextEl = tabElements[nextIndex]
            if (nextEl) {
              const nextCenter = nextEl.offsetLeft + nextEl.offsetWidth / 2
              const currentRight = el.offsetLeft + el.offsetWidth + dx
              if (currentRight >= nextCenter) {
                onMove(currentIndex, nextIndex)
                state.startX += nextEl.offsetWidth
                state.offsetX = ev.clientX - state.startX
                el.style.transform = `translateX(${state.offsetX}px)`
              }
            }
          }
        } else {
          const prevIndex = currentIndex - 1
          if (prevIndex >= 0) {
            const prevEl = tabElements[prevIndex]
            if (prevEl) {
              const prevCenter = prevEl.offsetLeft + prevEl.offsetWidth / 2
              const currentLeft = el.offsetLeft + dx
              if (currentLeft <= prevCenter) {
                onMove(currentIndex, prevIndex)
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
    [id, tabCount, onActivate, onMove]
  )

  useEffect(() => {
    return () => {
      dragState.current = null
    }
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault()
      onContextMenu(e, id)
    }
  }

  return (
    <div
      ref={tabRef}
      data-tab-id={id}
      className={`group relative flex items-center h-full w-[240px] min-w-[72px] cursor-default transition-colors duration-100 select-none ${
        isActive
          ? `${tw.bg.secondary} z-[2]`
          : `${tw.bg.tertiary} hover:bg-black/[0.06] dark:hover:bg-white/[0.08] z-[1]`
      }`}
      style={{ flex: '0 1 240px', minWidth: '72px' }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {isActive ? (
        <>
          <div
            className={`pointer-events-none absolute inset-0 border-x border-t ${
              tw.border
            } ${
              isFirst && hideFirstBorder
                ? 'border-l-transparent dark:border-l-transparent'
                : ''
            }`}
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
      <div className="flex items-center overflow-hidden flex-1 min-w-0 ml-2.5">
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {isLoading ? (
            <Loader2 size={14} className={`animate-spin ${tw.text.tertiary}`} />
          ) : (
            icon
          )}
        </div>
        <span
          className={`text-xs truncate flex-1 min-w-0 ml-2.5 ${
            isActive ? tw.text.primary : tw.text.secondary
          }`}
        >
          {title}
        </span>
      </div>
      {closable && (
        <button
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full mr-1.5 transition-all duration-100 opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/10 ${
            isActive ? '!opacity-70' : ''
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClose}
        >
          <X size={14} className={tw.text.secondary} />
        </button>
      )}
      {!closable && (
        <button
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full mr-1.5 transition-all duration-100 opacity-0 group-hover:opacity-70 hover:!opacity-100 ${
            isActive ? '!opacity-70' : ''
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClose}
        >
          <X size={14} className={tw.text.tertiary} />
        </button>
      )}
    </div>
  )
}

export interface TabBarProps<T extends IBaseTab> {
  tabs: T[]
  activeTabId: string
  onAddTab?: () => void
  onClose: (id: string) => void
  onActivate: (id: string) => void
  onMove: (fromIndex: number, toIndex: number) => void
  onContextMenu?: (e: React.MouseEvent, id: string) => void
  renderIcon?: (tab: T) => ReactNode
  isLoading?: (tab: T) => boolean
  getTitle?: (tab: T) => string
  hideFirstBorder?: boolean
}

export default function TabBar<T extends IBaseTab>({
  tabs,
  activeTabId,
  onAddTab,
  onClose,
  onActivate,
  onMove,
  onContextMenu,
  renderIcon,
  isLoading,
  getTitle,
  hideFirstBorder = false,
}: TabBarProps<T>) {
  return (
    <div
      className={`relative flex items-center ${tw.bg.secondary} h-10 min-h-[40px]`}
    >
      <div className="flex items-stretch overflow-x-hidden min-w-0 h-full relative">
        {tabs.map((tab, i) => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={getTitle ? getTitle(tab) : tab.title}
            isActive={tab.id === activeTabId}
            isFirst={i === 0}
            hideFirstBorder={hideFirstBorder}
            icon={renderIcon ? renderIcon(tab) : undefined}
            isLoading={isLoading ? isLoading(tab) : false}
            closable={tabs.length > 1}
            onClose={onClose}
            onActivate={onActivate}
            onMove={onMove}
            onContextMenu={onContextMenu}
            tabIndex={i}
            tabCount={tabs.length}
          />
        ))}
        {tabs.map((tab, i) => {
          const nextTab = tabs[i + 1]
          const isActive = tab.id === activeTabId
          const nextIsActive = nextTab?.id === activeTabId
          const isLast = i === tabs.length - 1
          const showSep = !isLast && !isActive && !nextIsActive

          if (!showSep) return null

          const left = `${((i + 1) / tabs.length) * 100}%`

          return (
            <div
              key={`sep-${tab.id}`}
              className={`absolute top-1/4 bottom-1/4 w-px z-[10] ${tw.bg.border}`}
              style={{ left }}
            />
          )
        })}
      </div>
      {onAddTab && (
        <button
          className={`p-1 mx-1.5 rounded-md flex-shrink-0 ${tw.hover} transition-colors`}
          onClick={onAddTab}
        >
          <Plus size={14} className={tw.text.secondary} />
        </button>
      )}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
      />
    </div>
  )
}
