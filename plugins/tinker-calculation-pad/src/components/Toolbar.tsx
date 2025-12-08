import { observer } from 'mobx-react-lite'
import { ListX, Eraser, Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const iconSize = 14
  const [copied, setCopied] = useState(false)

  const baseButtonClass = 'p-1.5 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed`

  const getCurrentLine = () => {
    return find(store.lines, (line) => line.id === store.activeLineId)
  }

  const handleClearCurrentLine = () => {
    store.updateExpression(store.activeLineId, '')
  }

  const isCurrentLineEmpty = () => {
    const currentLine = getCurrentLine()
    return !currentLine || isStrBlank(currentLine.expression)
  }

  const handleCopyResult = async () => {
    const currentLine = getCurrentLine()
    if (currentLine && currentLine.result) {
      try {
        await navigator.clipboard.writeText(currentLine.result)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const hasResult = () => {
    const currentLine = getCurrentLine()
    return currentLine && !isStrBlank(currentLine.result)
  }

  return (
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center">
      <button
        onClick={handleClearCurrentLine}
        disabled={isCurrentLineEmpty()}
        className={actionButtonClass}
        title={t('clearCurrent')}
      >
        <Eraser size={iconSize} />
      </button>

      <button
        onClick={handleCopyResult}
        disabled={!hasResult()}
        className={
          copied
            ? `${baseButtonClass} text-[#0fc25e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c]`
            : actionButtonClass
        }
        title={t('copyResult')}
      >
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </button>

      <div className="flex-1" />

      <button
        onClick={() => store.clear()}
        disabled={store.isEmpty}
        className={actionButtonClass}
        title={t('clear')}
      >
        <ListX size={iconSize} />
      </button>
    </div>
  )
})
