import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import { tw } from '../../theme'
import type { WebSearchResult } from '../../tools/web'

export interface SearchCardProps {
  query: string
  results: WebSearchResult[]
  error?: string
  isRunning?: boolean
  onOpenResult: (url: string) => void
}

export interface SearchToolMessage {
  data?: unknown
  toolArgs?: Record<string, unknown>
  error?: string
  toolStatus?: string
  generating?: boolean
}

export function getSearchCardProps(
  msg: SearchToolMessage
): Omit<SearchCardProps, 'onOpenResult'> {
  const results = Array.isArray(msg.data) ? (msg.data as WebSearchResult[]) : []
  const query =
    typeof msg.toolArgs?.query === 'string' ? msg.toolArgs.query : ''

  return {
    query,
    results,
    error: msg.error,
    isRunning:
      msg.toolStatus === 'running' || (msg.generating && results.length === 0),
  }
}

export default function SearchCard({
  query,
  results,
  error,
  isRunning = false,
  onOpenResult,
}: SearchCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const count = results.length
  const isError = Boolean(error)

  const statusText = isRunning
    ? t('searching')
    : isError
    ? t('searchFailed')
    : `${count} ${t('searchResults')}`

  return (
    <div
      className={`overflow-hidden rounded-xl border text-[11px] ${tw.border} ${tw.bg.secondary}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className={`w-full px-2.5 py-2 text-left ${
          isRunning || isError ? '' : tw.hover
        }`}
        disabled={isRunning || isError}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
              isError ? 'bg-red-500 dark:bg-red-600' : tw.primary.bg
            }`}
          >
            <Search size={10} className={isRunning ? 'animate-pulse' : ''} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`min-w-0 flex-1 truncate text-[11px] font-medium leading-4 ${
                  isError ? 'text-red-500 dark:text-red-400' : tw.text.primary
                }`}
              >
                {query}
              </div>
              <span className={`shrink-0 leading-none ${tw.text.tertiary}`}>
                {statusText}
              </span>
            </div>
          </div>
          {!isRunning && !isError && (
            <ChevronDown
              size={12}
              className={`shrink-0 transition-transform ${tw.text.tertiary} ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {expanded && results.length > 0 && (
        <div
          className={`flex flex-col gap-1.5 border-t px-2.5 py-2 ${tw.border}`}
        >
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onOpenResult(result.url)}
              className={`block w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors ${tw.border} ${tw.hover}`}
            >
              <div className="flex items-start gap-1.5">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-none ${tw.bg.secondary} ${tw.text.tertiary}`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`line-clamp-1 text-[11px] font-medium leading-4 ${tw.primary.text}`}
                  >
                    {result.title}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
