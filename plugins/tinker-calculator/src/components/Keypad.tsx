import type { ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { Divide, Minus, Plus, X } from 'lucide-react'
import className from 'licia/className'
import { tw } from 'share/theme'
import store from '../store'
import { KEY_ROWS, KeyConfig, KeyKind } from '../lib/keys'

const DEFAULT_TEXT_SIZE = 'text-xs md:text-sm'

const KIND_CLASSES: Record<KeyKind, string> = {
  number: `text-lg md:text-xl ${tw.text.both.primary}`,
  operator: `${DEFAULT_TEXT_SIZE} ${tw.text.both.primary}`,
  function: `${DEFAULT_TEXT_SIZE} ${tw.text.both.primary}`,
  control: `${DEFAULT_TEXT_SIZE} ${tw.text.both.primary}`,
  memory: `${DEFAULT_TEXT_SIZE} ${tw.text.both.primary}`,
}

const BASE_BUTTON =
  'h-11 md:h-12 rounded-full font-semibold transition-colors flex items-center justify-center'
const OPERATOR_ICON_SIZE = 18
const ACTIVE_FEEDBACK_STYLE = 'active:bg-gray-200 dark:active:bg-[#3a3a3c]'
const LEFT_KEY_STYLE = `${tw.bg.both.primary} ${ACTIVE_FEEDBACK_STYLE}`
const NUMBER_KEY_STYLE = `${tw.bg.both.tertiary} ${ACTIVE_FEEDBACK_STYLE}`
const OPERATOR_KEY_STYLE = `${tw.primary.bg} active:bg-[#0da84f]`

const EqualIcon = (
  <span className="flex flex-col items-center justify-center gap-[3px]">
    <span className="block h-[2px] w-4 bg-current" />
    <span className="block h-[2px] w-4 bg-current" />
  </span>
)

const OPERATOR_ICONS: Record<string, ReactNode> = {
  divide: <Divide size={OPERATOR_ICON_SIZE} />,
  multiply: <X size={OPERATOR_ICON_SIZE} />,
  minus: <Minus size={OPERATOR_ICON_SIZE} />,
  plus: <Plus size={OPERATOR_ICON_SIZE} />,
  equal: EqualIcon,
}

const getKeyLabelText = (key: KeyConfig) => {
  if (key.id === 'ac') {
    return store.isBackspaceActive ? '⌫' : 'AC'
  }
  if (key.id === 'toggleDegree') {
    return store.isDegree ? 'Deg' : 'Rad'
  }
  if (store.isSecond && key.altLabel) {
    return key.altLabel
  }
  return key.label
}

const renderFormattedLabel = (label: string) => {
  if (label === 'log10') {
    return (
      <span className="inline-flex items-end leading-none">
        <span>log</span>
        <sub className="text-[10px] md:text-[11px] leading-none ml-[1px]">
          10
        </sub>
      </span>
    )
  }

  if (!label.includes('^')) {
    return label
  }

  const [base, exponent] = label.split('^')

  return (
    <span className="inline-flex items-start gap-[2px] leading-none">
      <span>{base}</span>
      <i className="text-[9px] md:text-[10px] leading-none align-super not-italic relative -top-[2px]">
        {exponent}
      </i>
    </span>
  )
}

const getKeyAction = (key: KeyConfig) => {
  if (key.id === 'ac') {
    return {
      action: store.isBackspaceActive ? 'backspace' : 'clear',
      value: undefined,
    }
  }
  if (store.isSecond && key.altAction) {
    return { action: key.altAction, value: key.altValue }
  }
  return { action: key.action, value: key.value }
}

export default observer(function Keypad() {
  const handleKeyPress = (key: KeyConfig) => {
    const { action, value } = getKeyAction(key)

    switch (action) {
      case 'digit':
        store.inputDigit(value as string)
        break
      case 'dot':
        store.inputDot()
        break
      case 'operator':
        store.inputOperator(value as string)
        break
      case 'equals':
        store.evaluate()
        break
      case 'clear':
        store.clearAll()
        break
      case 'backspace':
        store.backspace()
        break
      case 'toggleSign':
        store.toggleSign()
        break
      case 'percent':
        store.applyPercent()
        break
      case 'wrap':
        store.applyWrap(value as string)
        break
      case 'append':
        store.appendToken(value as string)
        break
      case 'constant':
        store.appendToken(value as string)
        break
      case 'random':
        store.insertRandom()
        break
      case 'memoryClear':
        store.memoryClear()
        break
      case 'memoryAdd':
        store.memoryAdd()
        break
      case 'memorySubtract':
        store.memorySubtract()
        break
      case 'memoryRecall':
        store.memoryRecall()
        break
      case 'toggleSecond':
        store.toggleSecond()
        break
      case 'toggleDegree':
        store.toggleDegree()
        break
      default:
        break
    }
  }

  return (
    <div className="grid grid-cols-10 gap-3 md:gap-3.5">
      {KEY_ROWS.map((row) =>
        row.map((key, index) => {
          const kind = key.kind || 'number'
          const labelText = getKeyLabelText(key)
          const label = renderFormattedLabel(labelText)
          const isActive =
            (key.id === 'second' && store.isSecond) ||
            (key.id === 'toggleDegree' && store.isDegree)
          const icon = OPERATOR_ICONS[key.id]
          const columnStyle =
            kind === 'operator'
              ? OPERATOR_KEY_STYLE
              : index >= 6
              ? NUMBER_KEY_STYLE
              : LEFT_KEY_STYLE

          return (
            <button
              key={key.id}
              className={className(
                BASE_BUTTON,
                KIND_CLASSES[kind],
                columnStyle,
                {
                  'col-span-2': key.wide,
                  [tw.primary.border]: isActive,
                }
              )}
              type="button"
              onClick={() => handleKeyPress(key)}
              aria-label={labelText}
            >
              {icon || label}
            </button>
          )
        })
      )}
    </div>
  )
})
