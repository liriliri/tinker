import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import { tw } from '../../theme'
import type { WebSearchResult } from '../../tools/web'
import { AI_CHAT_NS } from './i18n'

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

export function isSearchMessageRenderable(msg: SearchToolMessage): boolean {
  if (msg.toolStatus === 'running' || msg.generating) return true
  if (!isStrBlank(msg.error ?? '')) return true
  const results = Array.isArray(msg.data) ? msg.data : []
  if (results.length > 0) return true
  const query =
    typeof msg.toolArgs?.query === 'string' ? msg.toolArgs.query : ''
  return !isStrBlank(query)
}

export default function SearchCard({
  query,
  results,
  error,
  isRunning = false,
  onOpenResult,
}: SearchCardProps) {
  const { t } = useTranslation(AI_CHAT_NS)
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
      className={`overflow-hidden rounded-md border text-[10px] ${tw.border} ${tw.bg.secondary}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className={`w-full px-2 py-1 text-left ${
          isRunning || isError ? '' : tw.hover
        }`}
        disabled={isRunning || isError}
      >
        <div className="flex items-center gap-1">
          <div
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-white ${
              isError ? 'bg-red-500 dark:bg-red-600' : tw.primary.bg
            }`}
          >
            <Search size={10} className={isRunning ? 'animate-pulse' : ''} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div
                className={`min-w-0 flex-1 truncate text-[10px] font-medium leading-none ${
                  isError ? 'text-red-500 dark:text-red-400' : tw.text.primary
                }`}
              >
                {query}
              </div>
              <span
                className={`shrink-0 text-[9px] leading-none ${tw.text.tertiary}`}
              >
                {statusText}
              </span>
            </div>
          </div>
          {!isRunning && !isError && (
            <ChevronDown
              size={10}
              className={`shrink-0 transition-transform ${tw.text.tertiary} ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </button>

      {expanded && results.length > 0 && (
        <div
          className={`flex flex-col gap-1 border-t px-2 py-1.5 ${tw.border}`}
        >
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onOpenResult(result.url)}
              className={`block w-full rounded border px-2 py-1 text-left transition-colors ${tw.border} ${tw.hover}`}
            >
              <div className="flex items-start gap-1">
                <span
                  className={`mt-px shrink-0 rounded px-1 py-px text-[8px] font-medium leading-none ${tw.bg.secondary} ${tw.text.tertiary}`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`line-clamp-1 text-[10px] font-medium leading-none ${tw.primary.text}`}
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
