import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { MenuItemConstructorOptions } from 'electron'
import clamp from 'licia/clamp'
import { isOnline } from '../lib/util'
import { tw } from '../theme'

type MenuState = {
  open: boolean
  x: number
  y: number
  items: MenuItemConstructorOptions[]
  key: number
}

const MARGIN = 8

let state: MenuState = { open: false, x: 0, y: 0, items: [], key: 0 }
let nextKey = 0
const listeners = new Set<() => void>()
let mounted = false

function setMenuState(next: Partial<MenuState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

function ensureMounted() {
  if (mounted) return
  mounted = true
  const el = document.createElement('div')
  document.body.appendChild(el)
  createRoot(el).render(<ContextMenuHost />)
}

function childItems(item: MenuItemConstructorOptions) {
  if (!item.submenu || !Array.isArray(item.submenu)) return null
  return item.submenu.filter((child) => child.visible !== false)
}

function runClick(item: MenuItemConstructorOptions) {
  const click = item.click as (() => void) | undefined
  click?.()
}

function placeInViewport(el: HTMLElement, x: number, y: number) {
  const rect = el.getBoundingClientRect()
  const maxLeft = Math.max(MARGIN, window.innerWidth - rect.width - MARGIN)
  const maxTop = Math.max(MARGIN, window.innerHeight - rect.height - MARGIN)
  el.style.left = `${clamp(x, MARGIN, maxLeft)}px`
  el.style.top = `${clamp(y, MARGIN, maxTop)}px`
}

function MenuSurface({
  items,
  x,
  y,
  onClose,
}: {
  items: MenuItemConstructorOptions[]
  x: number
  y: number
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [submenu, setSubmenu] = useState<{
    x: number
    y: number
    items: MenuItemConstructorOptions[]
  } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    placeInViewport(el, x, y)
  }, [x, y, items])

  const openSubmenu = (
    anchor: HTMLElement,
    children: MenuItemConstructorOptions[]
  ) => {
    const rect = anchor.getBoundingClientRect()
    setSubmenu({ x: rect.right - 4, y: rect.top, items: children })
  }

  return (
    <>
      <div
        ref={ref}
        className={`fixed z-[10000] min-w-40 p-1 rounded-lg border shadow-lg select-none text-[13px] ${tw.bg.primary} ${tw.border} ${tw.text.primary}`}
        style={{ left: x, top: y }}
        onContextMenu={(event) => event.preventDefault()}
      >
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div key={index} className={`h-px my-1 mx-1.5 ${tw.bg.border}`} />
            )
          }

          const children = childItems(item)
          const disabled = item.enabled === false
          const checked =
            item.type === 'checkbox' || item.type === 'radio'
              ? !!item.checked
              : false

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              className={`flex w-full items-center gap-2 h-7 px-2 rounded text-left ${tw.hover} disabled:opacity-40 disabled:pointer-events-none`}
              onMouseEnter={(event) => {
                if (children && children.length > 0) {
                  openSubmenu(event.currentTarget, children)
                  return
                }
                setSubmenu(null)
              }}
              onClick={() => {
                if (children && children.length > 0) return
                runClick(item)
                onClose()
              }}
            >
              <span className="w-3.5 text-center text-[11px] shrink-0">
                {checked ? '✓' : ''}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {children ? (
                <span className={`shrink-0 ${tw.text.tertiary}`}>›</span>
              ) : null}
            </button>
          )
        })}
      </div>
      {submenu ? (
        <MenuSurface
          items={submenu.items}
          x={submenu.x}
          y={submenu.y}
          onClose={onClose}
        />
      ) : null}
    </>
  )
}

function ContextMenuHost() {
  const [, tick] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const listener = () => tick((n) => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const { open, x, y, items, key } = state

  useEffect(() => {
    if (!open) return

    const close = () => setMenuState({ open: false })
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && rootRef.current?.contains(target)) return
      close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open, key])

  if (!open) return null

  return (
    <div ref={rootRef}>
      <MenuSurface
        key={key}
        items={items.filter((item) => item.visible !== false)}
        x={x}
        y={y}
        onClose={() => setMenuState({ open: false })}
      />
    </div>
  )
}

/**
 * Desktop uses the native menu. The browser draws this menu instead.
 */
export function showContextMenu(
  x: number,
  y: number,
  items: MenuItemConstructorOptions[]
) {
  if (!isOnline()) {
    tinker.showContextMenu(x, y, items)
    return
  }

  nextKey += 1
  setMenuState({ open: true, x, y, items, key: nextKey })
  ensureMounted()
}
