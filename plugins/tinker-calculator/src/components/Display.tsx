import type { ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Divide, Minus, Plus, X } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

const renderExpression = (expression: string, iconSize: number): ReactNode => {
  if (!expression) return null

  const parts = expression.split(/([+\-*/])/).filter((p) => p !== '')

  return (
    <>
      {parts.map((part, index) => {
        if (part === '+') {
          return (
            <span key={index} className="inline-flex items-center mx-0.5">
              <Plus size={iconSize} />
            </span>
          )
        }
        if (part === '-') {
          const prevPart = index > 0 ? parts[index - 1] : ''
          const isNegativeSign =
            index === 0 ||
            prevPart === '(' ||
            prevPart === '+' ||
            prevPart === '-' ||
            prevPart === '*' ||
            prevPart === '/'

          if (isNegativeSign) {
            return <span key={index}>{part}</span>
          }

          return (
            <span key={index} className="inline-flex items-center mx-0.5">
              <Minus size={iconSize} />
            </span>
          )
        }
        if (part === '*') {
          return (
            <span key={index} className="inline-flex items-center mx-0.5">
              <X size={iconSize} />
            </span>
          )
        }
        if (part === '/') {
          return (
            <span key={index} className="inline-flex items-center mx-0.5">
              <Divide size={iconSize} />
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

export default observer(function Display() {
  const { t } = useTranslation()
  const displayText = store.hasError ? t('error') : store.displayValue

  return (
    <div className={`px-4 py-4 mb-8 rounded-xl ${tw.bg.tertiary}`}>
      <div
        className={`h-8 flex items-center justify-end text-xl md:text-2xl tracking-wide overflow-hidden ${tw.text.both.tertiary}`}
      >
        {renderExpression(store.preview, 18)}
      </div>
      <div
        className={`mt-2 flex items-center justify-end text-3xl md:text-4xl font-semibold tabular-nums overflow-hidden ${tw.text.both.primary}`}
        title={displayText}
      >
        {renderExpression(displayText, 28)}
      </div>
    </div>
  )
})
