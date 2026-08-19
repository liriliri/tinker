import $attr from 'licia/$attr'
import $css from 'licia/$css'
import $insert from 'licia/$insert'
import $remove from 'licia/$remove'
import contain from 'licia/contain'
import find from 'licia/find'
import isEl from 'licia/isEl'
import sleep from 'licia/sleep'

const CURSOR_ATTR = 'data-tinker-recording-cursor'
const CURSOR_SIZE = 22
const CURSOR_HOTSPOT_X = (341.333 / 1024) * CURSOR_SIZE
const CURSOR_HOTSPOT_Y = (203 / 1024) * CURSOR_SIZE
const CURSOR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%" overflow="visible"><path d="M607.274667 612.992l88.661333 190.122667a21.333333 21.333333 0 0 1-10.325333 28.373333l-77.312 36.053333a21.333333 21.333333 0 0 1-28.373334-10.325333l-90.666666-194.474667-111.488 111.488A21.333333 21.333333 0 0 1 341.333333 759.168V218.88a21.333333 21.333333 0 0 1 35.669334-15.786667l397.056 360.96a21.333333 21.333333 0 0 1-12.714667 37.077334l-154.069333 11.861333z" fill="#000" stroke="#fff" stroke-width="68" stroke-linejoin="round" stroke-linecap="round" paint-order="fill stroke"/></svg>'
const MOVE_MS = 300
const FADE_MS = 500
const RIPPLE_MS = 550
const ACTION_TAGS = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']
const ACTION_ROLES = ['button', 'textbox', 'link']

let cursorRoot: HTMLElement | null = null
let cursorEl: HTMLElement | null = null
let highlightEl: HTMLElement | null = null
let pending: { x: number; y: number } | null = null
let raf = 0
let cursorReady = false
let moveEndsAt = 0
let clickTimer = 0
let pendingAction: {
  x: number
  y: number
  box?: { x: number; y: number; width: number; height: number }
} | null = null

function remainingMoveMs() {
  return Math.max(0, moveEndsAt - performance.now())
}

function clearClickTimer() {
  if (!clickTimer) return
  clearTimeout(clickTimer)
  clickTimer = 0
}

function flushCursor() {
  raf = 0
  if (!cursorEl || !pending) return
  const { x, y } = pending
  pending = null
  const next = `translate(${x - CURSOR_HOTSPOT_X}px, ${y - CURSOR_HOTSPOT_Y}px)`
  if (!cursorReady) {
    cursorEl.style.transition = 'none'
    cursorEl.style.transform = next
    cursorEl.style.visibility = 'visible'
    void cursorEl.offsetWidth
    cursorEl.style.transition = `transform ${MOVE_MS}ms ease`
    cursorReady = true
    moveEndsAt = performance.now()
    return
  }
  const alreadyThere = cursorEl.style.transform === next
  cursorEl.style.transform = next
  moveEndsAt = performance.now() + (alreadyThere ? 0 : MOVE_MS)
}

function moveRecordingCursor(event: MouseEvent) {
  pending = { x: event.clientX, y: event.clientY }
  if (!raf) raf = requestAnimationFrame(flushCursor)
}

function placeCursor(x: number, y: number) {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
  pending = { x, y }
  flushCursor()
}

export function moveRecordingCursorTo(x: number, y: number) {
  if (!cursorEl) return Promise.resolve()
  placeCursor(x, y)
  return sleep(remainingMoveMs())
}

function replayFade(el: HTMLElement) {
  el.style.animation = 'none'
  void el.offsetWidth
  el.style.animation = `tinker-pw-fade ${FADE_MS}ms ease-out forwards`
}

function actionTarget(event: Event): Element | null {
  const hit = find(event.composedPath(), (node): node is Element => {
    if (!isEl(node)) return false
    return (
      contain(ACTION_TAGS, node.tagName) ||
      contain(ACTION_ROLES, node.getAttribute('role'))
    )
  })
  if (hit) return hit
  return isEl(event.target) ? event.target : null
}

function spawnClickRipple(x: number, y: number) {
  if (!cursorRoot) return
  const ripple = document.createElement('div')
  $css(ripple, {
    position: 'absolute',
    left: x - RIPPLE_SIZE / 2,
    top: y - RIPPLE_SIZE / 2,
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: '50%',
    background: 'rgba(70, 70, 70, 0.4)',
    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.9)',
    zIndex: 3,
  })
  $insert.append(cursorRoot, ripple)
  const anim = ripple.animate(
    [
      { opacity: 0.95, transform: 'scale(0.4)' },
      { opacity: 0, transform: 'scale(1.8)' },
    ],
    { duration: RIPPLE_MS, easing: 'ease-out', fill: 'forwards' }
  )
  anim.onfinish = () => $remove(ripple)
}

function playPendingAction() {
  clickTimer = 0
  const action = pendingAction
  pendingAction = null
  if (!action || !cursorRoot) return
  spawnClickRipple(action.x, action.y)
  if (!highlightEl || !action.box) return
  $css(highlightEl, {
    left: action.box.x,
    top: action.box.y,
    width: action.box.width,
    height: action.box.height,
    display: 'block',
  })
  replayFade(highlightEl)
}

function showActionDecorations(event: MouseEvent) {
  if (event.button !== 0) return
  placeCursor(event.clientX, event.clientY)
  const target = actionTarget(event)
  const box = target?.getBoundingClientRect()
  pendingAction = {
    x: event.clientX,
    y: event.clientY,
    box: box
      ? { x: box.x, y: box.y, width: box.width, height: box.height }
      : undefined,
  }
  clearClickTimer()
  clickTimer = window.setTimeout(playPendingAction, remainingMoveMs())
}

export function showRecordingCursor() {
  if (cursorRoot) return

  cursorRoot = document.createElement('div')
  $attr(cursorRoot, CURSOR_ATTR, '')
  $css(cursorRoot, {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 2147483647,
  })

  const style = document.createElement('style')
  style.textContent = `
    html, html * { cursor: none !important; }
    @keyframes tinker-pw-fade {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `
  $insert.append(cursorRoot, style)

  highlightEl = document.createElement('div')
  $css(highlightEl, {
    position: 'absolute',
    display: 'none',
    background: 'rgba(0, 128, 255, 0.15)',
    border: '2px solid rgba(0, 128, 255, 0.6)',
    zIndex: 1,
  })
  $insert.append(cursorRoot, highlightEl)

  cursorEl = document.createElement('div')
  $css(cursorEl, {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    visibility: 'hidden',
    zIndex: 4,
    willChange: 'transform',
    filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35))',
  })
  cursorEl.innerHTML = CURSOR_SVG
  $insert.append(cursorRoot, cursorEl)
  $insert.append(document.documentElement, cursorRoot)

  window.addEventListener('mousemove', moveRecordingCursor, true)
  window.addEventListener('pointerdown', showActionDecorations, true)
}

export function hideRecordingCursor() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
  window.removeEventListener('mousemove', moveRecordingCursor, true)
  window.removeEventListener('pointerdown', showActionDecorations, true)
  clearClickTimer()
  if (cursorRoot) {
    $remove(cursorRoot)
    cursorRoot = null
  }
  cursorEl = null
  highlightEl = null
  pending = null
  pendingAction = null
  moveEndsAt = 0
  cursorReady = false
}
