import type { ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { Divide, Minus, Plus, X } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import { KEY_ROWS, KeyConfig, KeyKind } from '../lib/keys'

const KIND_CLASSES: Record<KeyKind, string> = {
  number: tw.text.both.primary,
  operator: tw.text.both.primary,
  function: tw.text.both.primary,
  control: tw.text.both.primary,
  memory: tw.text.both.primary,
}

const BASE_BUTTON =
  'h-11 md:h-12 rounded-full text-xs md:text-sm font-semibold transition-colors flex items-center justify-center'
const OPERATOR_ICON_SIZE = 18
const LEFT_KEY_STYLE = `${tw.bg.both.primary} ${tw.hover.both}`
const NUMBER_KEY_STYLE = `${tw.bg.both.tertiary} ${tw.hover.both}`
const OPERATOR_KEY_STYLE = `${tw.primary.bg} ${tw.primary.bgHover}`

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

const getKeyLabel = (key: KeyConfig) => {
  if (key.id === 'toggleDegree') {
    return store.isDegree ? 'Deg' : 'Rad'
  }
  if (store.isSecond && key.altLabel) {
    return key.altLabel
  }
  return key.label
}

const getKeyAction = (key: KeyConfig) => {
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
        store.insertConstant(value as string)
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
          const label = getKeyLabel(key)
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
              className={`${BASE_BUTTON} ${KIND_CLASSES[kind]} ${
                key.wide ? 'col-span-2' : ''
              } ${columnStyle} ${isActive ? tw.primary.border : ''}`}
              type="button"
              onClick={() => handleKeyPress(key)}
              aria-label={label}
            >
              {icon || label}
            </button>
          )
        })
      )}
    </div>
  )
})
