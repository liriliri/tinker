import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import { tw } from 'share/theme'
import type { WebSearchResult } from 'share/tools/web'
import type { ChatMessage } from '../types'

interface Props {
  msg: ChatMessage
}

export default observer(function SearchCard({ msg }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const results = Array.isArray(msg.data) ? (msg.data as WebSearchResult[]) : []
  const query =
    typeof msg.toolArgs?.query === 'string' ? msg.toolArgs.query : ''

  if (
    msg.toolStatus === 'running' ||
    (msg.generating && results.length === 0)
  ) {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] ${tw.border} ${tw.bg.secondary} ${tw.text.secondary}`}
      >
        <Search size={11} className="animate-pulse shrink-0" />
        <span>
          {t('searching')}：<span className={tw.text.primary}>{query}</span>
        </span>
      </div>
    )
  }

  if (msg.error) {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] text-red-500 dark:text-red-400 ${tw.border} ${tw.bg.secondary}`}
      >
        <Search size={11} className="shrink-0" />
        <span>
          {t('searchFailed')}：{query}
        </span>
      </div>
    )
  }

  const count = results.length

  return (
    <div
      className={`overflow-hidden rounded-xl border text-[11px] ${tw.border} ${tw.bg.secondary}`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full px-2.5 py-2 text-left ${tw.hover}`}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tw.primary.bg} text-white`}
          >
            <Search size={10} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`min-w-0 flex-1 truncate text-[11px] font-medium leading-4 ${tw.text.primary}`}
              >
                {query}
              </div>
              <span className={`shrink-0 leading-none ${tw.text.tertiary}`}>
                {count} {t('searchResults')}
              </span>
            </div>
          </div>
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform ${tw.text.tertiary} ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {expanded && results.length > 0 && (
        <div
          className={`flex flex-col gap-1.5 border-t px-2.5 py-2 ${tw.border}`}
        >
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => aiChat.openExternal(r.url)}
              className={`block w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors ${tw.border} ${tw.hover}`}
            >
              <div className="flex items-start gap-1.5">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none ${tw.bg.secondary} ${tw.text.tertiary}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`line-clamp-1 text-[11px] font-medium leading-4 ${tw.primary.text}`}
                  >
                    {r.title}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
