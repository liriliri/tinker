import { useState, useEffect, useCallback, useRef } from 'react'
import isMac from 'licia/isMac'
import { tw } from 'share/theme'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const MODIFIER_CODES = [
  'MetaLeft',
  'MetaRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
]

// DOM e.code -> Electron accelerator key name
const CODE_TO_ACCELERATOR: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: 'Space',
  Enter: 'Return',
  Escape: 'Escape',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  CapsLock: 'Capslock',
  NumLock: 'Numlock',
  ScrollLock: 'Scrolllock',
  PrintScreen: 'PrintScreen',
  Numpad0: 'num0',
  Numpad1: 'num1',
  Numpad2: 'num2',
  Numpad3: 'num3',
  Numpad4: 'num4',
  Numpad5: 'num5',
  Numpad6: 'num6',
  Numpad7: 'num7',
  Numpad8: 'num8',
  Numpad9: 'num9',
  NumpadDecimal: 'numdec',
  NumpadAdd: 'numadd',
  NumpadSubtract: 'numsub',
  NumpadMultiply: 'nummult',
  NumpadDivide: 'numdiv',
  NumpadEnter: 'Return',
}

const DOUBLE_TAP_INTERVAL = 400

interface ShortcutInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function getModifierName(code: string): string {
  switch (code) {
    case 'MetaLeft':
    case 'MetaRight':
      return 'Command'
    case 'ControlLeft':
    case 'ControlRight':
      return 'Ctrl'
    case 'AltLeft':
    case 'AltRight':
      return isMac ? 'Option' : 'Alt'
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'Shift'
    default:
      return ''
  }
}

export default function ShortcutInput({
  value,
  onChange,
  placeholder,
}: ShortcutInputProps) {
  const { t } = useTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])

  const mainKeyPressedRef = useRef(false)
  const lastModifierTapRef = useRef<{ modifier: string; time: number } | null>(
    null
  )
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDoubleTapTimer = useCallback(() => {
    if (doubleTapTimerRef.current) {
      clearTimeout(doubleTapTimerRef.current)
      doubleTapTimerRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    mainKeyPressedRef.current = false
    lastModifierTapRef.current = null
    clearDoubleTapTimer()
    setRecordedKeys([])
  }, [clearDoubleTapTimer])

  const confirmShortcut = useCallback(
    (shortcut: string) => {
      setRecordedKeys(shortcut.split('+'))
      onChange(shortcut)
      stopRecording()
    },
    [onChange, stopRecording]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const isModifierKey = MODIFIER_CODES.includes(e.code)

      const keys: string[] = []
      if (e.metaKey) keys.push('Command')
      if (e.ctrlKey) keys.push('Ctrl')
      if (e.altKey) keys.push(isMac ? 'Option' : 'Alt')
      if (e.shiftKey) keys.push('Shift')

      if (!isModifierKey) {
        mainKeyPressedRef.current = true
        clearDoubleTapTimer()
        lastModifierTapRef.current = null

        let mainKey = ''
        if (e.code.startsWith('Key')) {
          mainKey = e.code.replace('Key', '')
        } else if (e.code.startsWith('Digit')) {
          mainKey = e.code.replace('Digit', '')
        } else if (/^F([1-9]|1[0-2])$/.test(e.code)) {
          mainKey = e.code
        } else {
          mainKey = CODE_TO_ACCELERATOR[e.code] || ''
        }

        if (!mainKey) {
          mainKeyPressedRef.current = false
          toast(t('unsupportedKey'))
          stopRecording()
          return
        }

        keys.push(mainKey)
      }

      setRecordedKeys(keys)
    },
    [clearDoubleTapTimer, stopRecording, t]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const isModifierKey = MODIFIER_CODES.includes(e.code)

      if (isModifierKey && !mainKeyPressedRef.current) {
        // Only modifier key released, no main key pressed
        const modifier = getModifierName(e.code)
        if (!modifier) {
          stopRecording()
          return
        }

        // Check if any modifiers still active
        if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
          return
        }

        const now = Date.now()

        // Check for double-tap
        if (
          lastModifierTapRef.current &&
          lastModifierTapRef.current.modifier === modifier &&
          now - lastModifierTapRef.current.time < DOUBLE_TAP_INTERVAL
        ) {
          clearDoubleTapTimer()
          confirmShortcut(`${modifier}+${modifier}`)
          return
        }

        // First tap, wait for second
        lastModifierTapRef.current = { modifier, time: now }
        setRecordedKeys(['...'])

        clearDoubleTapTimer()
        doubleTapTimerRef.current = setTimeout(() => {
          lastModifierTapRef.current = null
          doubleTapTimerRef.current = null
          if (isRecording) {
            setRecordedKeys([])
          }
        }, DOUBLE_TAP_INTERVAL)
        return
      }

      // Normal shortcut: at least one modifier + one main key
      if (recordedKeys.length > 1 && mainKeyPressedRef.current) {
        confirmShortcut(recordedKeys.join('+'))
        return
      }

      // Single function key
      if (
        recordedKeys.length === 1 &&
        mainKeyPressedRef.current &&
        /^F([1-9]|1[0-2])$/.test(recordedKeys[0])
      ) {
        confirmShortcut(recordedKeys[0])
        return
      }

      // Escape cancels recording
      if (e.code === 'Escape') {
        stopRecording()
        return
      }

      stopRecording()
    },
    [recordedKeys, confirmShortcut, stopRecording, clearDoubleTapTimer]
  )

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      // Only stop if clicking outside the input element
      const target = e.target as HTMLElement
      if (target && target.hasAttribute('data-shortcut-input')) {
        return
      }
      stopRecording()
    },
    [stopRecording]
  )

  useEffect(() => {
    if (isRecording) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isRecording, handleKeyDown, handleKeyUp, handleClickOutside])

  const displayText = isRecording
    ? recordedKeys.length > 0
      ? recordedKeys.join('+')
      : t('recording')
    : value || placeholder || t('recordShortcut')

  return (
    <div
      data-shortcut-input
      className={`min-w-[120px] px-2 py-1 border text-xs text-center cursor-pointer select-none transition-all rounded ${
        isRecording
          ? `${tw.primary.border} ${tw.primary.bgFocused} ${tw.primary.text} animate-pulse`
          : `${tw.bg.input} ${tw.text.primary} ${tw.gray.border600} ${tw.hover}`
      }`}
      onClick={() => setIsRecording(true)}
    >
      {displayText}
    </div>
  )
}
