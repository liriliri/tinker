import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import className from 'licia/className'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import FileIcon from 'share/components/FileIcon'
import store from '../store'

const ROW_HEIGHT = 22

export default observer(function QuickOpen() {
  const { t } = useTranslation()
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const quickOpen = store.quickOpen

  useEffect(() => {
    if (!quickOpen.open) return

    const input = headerRef.current?.querySelector('input')
    input?.focus()
    input?.select()
  }, [quickOpen.open])

  useEffect(() => {
    if (!quickOpen.open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        quickOpen.hide()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        quickOpen.moveSelection(1)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        quickOpen.moveSelection(-1)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        void quickOpen.acceptSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quickOpen.open, quickOpen])

  useEffect(() => {
    if (!quickOpen.open || !listRef.current) return

    const selected = listRef.current.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [quickOpen.open, quickOpen.selectedIndex, quickOpen.items.length])

  if (!quickOpen.open) return null

  const items = quickOpen.items
  const trimmedQuery = quickOpen.query.trim()
  const showNoResults =
    !quickOpen.searching && items.length === 0 && !!trimmedQuery

  return (
    <div className="fixed inset-0 z-50" onMouseDown={() => quickOpen.hide()}>
      <div
        className={`fixed left-1/2 top-[10%] -translate-x-1/2 w-[600px] max-w-[90vw] max-h-[60vh] flex flex-col rounded-md shadow-2xl overflow-hidden ${tw.bg.secondary} border ${tw.border}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div ref={headerRef} className={`p-2 border-b ${tw.border}`}>
          <TextInput
            type="text"
            value={quickOpen.query}
            onChange={(e) => quickOpen.setQuery(e.target.value)}
            placeholder={t('quickOpenPlaceholder')}
            spellCheck={false}
            autoFocus
          />
        </div>

        <div ref={listRef} className="overflow-y-auto min-h-0 flex-1">
          {quickOpen.searching && items.length === 0 && (
            <div
              className={`px-3 py-2 text-sm ${tw.text.tertiary}`}
              style={{ lineHeight: `${ROW_HEIGHT}px` }}
            >
              {t('quickOpenSearching')}
            </div>
          )}

          {showNoResults && (
            <div
              className={`px-3 py-2 text-sm ${tw.text.tertiary}`}
              style={{ lineHeight: `${ROW_HEIGHT}px` }}
            >
              {t('quickOpenNoResults')}
            </div>
          )}

          {items.map((item, index) => {
            const selected = index === quickOpen.selectedIndex

            return (
              <button
                key={item.path}
                type="button"
                data-selected={selected ? 'true' : 'false'}
                className={className(
                  'w-full flex items-center gap-2 px-3 text-left text-sm',
                  selected ? tw.primary.bgFocused : tw.hover
                )}
                style={{ height: ROW_HEIGHT }}
                onMouseEnter={() => quickOpen.selectIndex(index)}
                onClick={() => {
                  quickOpen.selectIndex(index)
                  void quickOpen.acceptSelected()
                }}
              >
                <FileIcon
                  name={item.name}
                  path={item.path}
                  isDark={store.isDark}
                  size={16}
                />
                <span className={`truncate ${tw.text.primary}`}>
                  {item.name}
                </span>
                <span
                  className={`ml-auto truncate text-xs ${tw.text.tertiary}`}
                >
                  {item.relativePath}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})
