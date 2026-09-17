import isMac from 'licia/isMac'

const MODIFIER_KEYS = new Set([
  'Ctrl',
  'CtrlRight',
  'Alt',
  'AltRight',
  'Shift',
  'ShiftRight',
  'Meta',
  'MetaRight',
  'CapsLock',
  'NumLock',
  'ScrollLock',
])

const KEY_LABELS: Record<string, string> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Escape: 'Esc',
  Backspace: '⌫',
  Delete: '⌦',
  Enter: '↵',
  Tab: '⇥',
  Space: 'Space',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  Home: 'Home',
  End: 'End',
  Insert: 'Ins',
  PrintScreen: 'PrtSc',
  Semicolon: ';',
  Equal: '=',
  Comma: ',',
  Minus: '-',
  Period: '.',
  Slash: '/',
  Backquote: '`',
  BracketLeft: '[',
  Backslash: '\\',
  BracketRight: ']',
  Quote: "'",
  NumpadMultiply: 'Num *',
  NumpadAdd: 'Num +',
  NumpadSubtract: 'Num -',
  NumpadDecimal: 'Num .',
  NumpadDivide: 'Num /',
  NumpadEnter: 'Num ↵',
  CapsLock: 'Caps',
  NumLock: 'Num',
  ScrollLock: 'Scroll',
}

function modLabel(kind: 'ctrl' | 'alt' | 'shift' | 'meta'): string {
  if (isMac) {
    switch (kind) {
      case 'ctrl':
        return '⌃'
      case 'alt':
        return '⌥'
      case 'shift':
        return '⇧'
      case 'meta':
        return '⌘'
    }
  }
  switch (kind) {
    case 'ctrl':
      return 'Ctrl'
    case 'alt':
      return 'Alt'
    case 'shift':
      return 'Shift'
    case 'meta':
      return 'Win'
  }
}

function prettyModifier(key: string): string {
  switch (key) {
    case 'Ctrl':
    case 'CtrlRight':
      return modLabel('ctrl')
    case 'Alt':
    case 'AltRight':
      return modLabel('alt')
    case 'Shift':
    case 'ShiftRight':
      return modLabel('shift')
    case 'Meta':
    case 'MetaRight':
      return modLabel('meta')
    default:
      return KEY_LABELS[key] || key
  }
}

function prettyKey(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key]
  if (/^Numpad\d$/.test(key)) return `Num ${key.slice(-1)}`
  if (key.length === 1) return key.toUpperCase()
  return key
}

function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key)
}

export function formatKeyStroke(event: tinker.KeyboardEvent): string | null {
  const key = event.key
  if (!key) return null

  if (isModifierKey(key)) {
    return prettyModifier(key)
  }

  const parts: string[] = []
  if (event.ctrlKey) parts.push(modLabel('ctrl'))
  if (event.altKey) parts.push(modLabel('alt'))
  if (event.shiftKey) parts.push(modLabel('shift'))
  if (event.metaKey) parts.push(modLabel('meta'))
  parts.push(prettyKey(key))

  return parts.join(isMac ? '' : '+')
}
