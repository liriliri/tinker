import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import isStrBlank from 'licia/isStrBlank'
import className from 'licia/className'
import toast from 'react-hot-toast'
import { THEME_COLORS, tw } from 'share/theme'
import store from '../store'

export default observer(function CalculationList() {
  const { t } = useTranslation()
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const primaryBg = store.isDark
    ? THEME_COLORS.bg.dark.primary
    : THEME_COLORS.bg.light.primary

  const handleKeyDown = (
    lineId: number,
    lineIndex: number,
    line: { id: number; expression: string; result: string },
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      // If current line is empty, do nothing
      if (isStrBlank(line.expression)) {
        return
      }

      const nextIndex = lineIndex + 1

      if (nextIndex < store.lines.length) {
        // If there's a next line, check if it's empty and fill with result if so
        const nextLine = store.lines[nextIndex]
        const nextLineId = nextLine.id

        if (line.result && isStrBlank(nextLine.expression)) {
          // Fill next line with current result
          store.updateExpression(nextLineId, line.result)
        }

        store.setActiveLineId(nextLineId)
        setTimeout(() => {
          store.inputRefs[nextLineId]?.focus()
        }, 0)
      } else {
        // If it's the last line, create a new one
        store.addNewLine(lineId)
      }
    } else if (e.key === 'Backspace') {
      if (isStrBlank(line.expression) && store.lines.length > 1) {
        e.preventDefault()
        store.deleteLine(lineId)
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
      {store.lines.map((line, lineIndex) => {
        const isActive = line.id === store.activeLineId
        const isHovered = hoveredId === line.id
        return (
          <div
            key={line.id}
            onClick={() => handleLineClick(line.id)}
            onMouseEnter={() => setHoveredId(line.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={
              isActive || isHovered
                ? {
                    borderLeftColor: isActive
                      ? THEME_COLORS.primary
                      : undefined,
                    backgroundColor: primaryBg,
                  }
                : undefined
            }
            className={className(
              `px-4 py-3 border-b transition-colors cursor-text border-l-4 ${tw.bg.tertiary}`,
              tw.border,
              {
                'border-l-transparent': !isActive,
              }
            )}
          >
            <textarea
              ref={(el) => store.setInputRef(line.id, el as any)}
              value={line.expression}
              onChange={(e) => store.updateExpression(line.id, e.target.value)}
              onInput={handleInput}
              onKeyDown={(e) =>
                handleKeyDown(line.id, lineIndex, line, e as any)
              }
              placeholder={t('placeholder')}
              rows={1}
              className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-200 text-xl font-mono resize-none overflow-hidden pointer-events-auto"
            />
            {line.result && (
              <div className="flex items-center justify-end mt-2">
                <span className="text-gray-400 dark:text-gray-500 mr-2 text-xl">
                  =
                </span>
                <span
                  onClick={(e) => handleResultClick(e, line.result)}
                  className={`text-gray-800 dark:text-gray-200 text-2xl font-mono font-medium cursor-pointer ${tw.primary.text} transition-colors`}
                  title={t('clickToCopy')}
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
