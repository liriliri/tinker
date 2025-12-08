import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import toast from 'react-hot-toast'
import store from '../store'

export default observer(function CalculationList() {
  const { t } = useTranslation()

  const handleKeyDown = (
    id: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      store.addNewLine(id)
    } else if (e.key === 'Backspace') {
      const currentLine = find(store.lines, (line) => line.id === id)
      if (
        currentLine &&
        isStrBlank(currentLine.expression) &&
        store.lines.length > 1
      ) {
        e.preventDefault()
        store.deleteLine(id)
      }
    }
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto'
    target.style.height = target.scrollHeight + 'px'
  }

  const formatNumber = (value: string): string => {
    const num = parseFloat(value)
    if (isNaN(num)) return value

    // Separate integer and decimal parts
    const parts = num.toString().split('.')
    // Add thousand separators to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return parts.join('.')
  }

  const handleLineClick = (id: number) => {
    store.setActiveLineId(id)
    // Auto focus to the corresponding input
    setTimeout(() => {
      store.inputRefs[id]?.focus()
    }, 0)
  }

  const handleResultClick = async (e: React.MouseEvent, result: string) => {
    e.stopPropagation() // Prevent event bubbling to avoid triggering line selection
    try {
      await navigator.clipboard.writeText(result)
      toast.success(t('copySuccess'))
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className="w-full">
      {store.lines.map((line) => {
        const isActive = line.id === store.activeLineId
        return (
          <div
            key={line.id}
            onClick={() => handleLineClick(line.id)}
            style={isActive ? { borderLeftColor: '#0fc25e' } : undefined}
            className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 transition-colors cursor-text ${
              isActive
                ? 'border-l-4 bg-gray-50 dark:bg-[#252525]'
                : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-[#252525]'
            }`}
          >
            <textarea
              ref={(el) => store.setInputRef(line.id, el as any)}
              value={line.expression}
              onChange={(e) => store.updateExpression(line.id, e.target.value)}
              onInput={handleInput}
              onKeyDown={(e) => handleKeyDown(line.id, e as any)}
              placeholder={t('placeholder')}
              rows={1}
              className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-200 text-base font-mono resize-none overflow-hidden pointer-events-auto"
            />
            {line.result && (
              <div className="flex items-center justify-end mt-2">
                <span className="text-gray-400 dark:text-gray-500 mr-2 text-xl">
                  =
                </span>
                <span
                  onClick={(e) => handleResultClick(e, line.result)}
                  className="text-gray-800 dark:text-gray-200 text-2xl font-mono font-medium cursor-pointer hover:text-[#0fc25e] dark:hover:text-[#0fc25e] transition-colors"
                  title="点击复制"
                >
                  {formatNumber(line.result)}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
