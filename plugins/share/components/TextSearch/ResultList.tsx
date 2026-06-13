import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tw } from '../../theme'
import FileGroupHeader from './FileGroupHeader'
import MatchLine from './MatchLine'
import { useTextSearchContext } from './context'
import {
  TEXT_SEARCH_ROW_HEIGHT,
  buildTextSearchRows,
  type TextSearchRow,
} from './rows'

interface VisibleRange {
  start: number
  end: number
}

interface VirtualResultListProps {
  rows: TextSearchRow[]
  activeMatchKey: string
}

interface SearchResultRowProps {
  row: TextSearchRow
  isActive: boolean
}

function getVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  itemCount: number,
  overscan: number
): VisibleRange {
  const start = Math.max(
    0,
    Math.floor(scrollTop / TEXT_SEARCH_ROW_HEIGHT) - overscan
  )
  const end = Math.min(
    itemCount,
    Math.ceil((scrollTop + viewportHeight) / TEXT_SEARCH_ROW_HEIGHT) + overscan
  )
  return { start, end }
}

function rangesEqual(a: VisibleRange, b: VisibleRange): boolean {
  return a.start === b.start && a.end === b.end
}

const SearchResultRow = memo(function SearchResultRow({
  row,
  isActive,
}: SearchResultRowProps) {
  if (row.type === 'header') {
    return <FileGroupHeader group={row.group} collapsed={row.collapsed} />
  }

  return (
    <MatchLine
      filePath={row.filePath}
      result={row.result}
      segments={row.segments}
      isActive={isActive}
    />
  )
})

function VirtualResultList({ rows, activeMatchKey }: VirtualResultListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTopRef = useRef(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [range, setRange] = useState<VisibleRange>({ start: 0, end: 0 })
  const overscan = 8

  const syncRange = useCallback(
    (scrollTop: number, height: number) => {
      const next = getVisibleRange(scrollTop, height, rows.length, overscan)
      setRange((prev) => (rangesEqual(prev, next) ? prev : next))
    },
    [rows.length]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateViewport = () => {
      const height = el.clientHeight
      setViewportHeight(height)
      syncRange(scrollTopRef.current, height)
    }
    updateViewport()

    const observer = new ResizeObserver(updateViewport)
    observer.observe(el)
    return () => observer.disconnect()
  }, [syncRange])

  useEffect(() => {
    syncRange(scrollTopRef.current, viewportHeight)
  }, [rows.length, syncRange, viewportHeight])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      scrollTopRef.current = el.scrollTop
      syncRange(el.scrollTop, el.clientHeight)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [syncRange])

  const totalHeight = rows.length * TEXT_SEARCH_ROW_HEIGHT
  const offsetY = range.start * TEXT_SEARCH_ROW_HEIGHT

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-y-auto ${tw.bg.tertiary}`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {rows.slice(range.start, range.end).map((row) => (
            <div
              key={row.key}
              style={{ height: TEXT_SEARCH_ROW_HEIGHT }}
              className="overflow-hidden"
            >
              <SearchResultRow
                row={row}
                isActive={
                  row.type === 'match' && row.matchKey === activeMatchKey
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ResultList() {
  const { groups, collapsed, activeMatchKey } = useTextSearchContext()
  const rows = useMemo(
    () => buildTextSearchRows(groups, collapsed),
    [groups, collapsed]
  )

  return <VirtualResultList rows={rows} activeMatchKey={activeMatchKey} />
}
