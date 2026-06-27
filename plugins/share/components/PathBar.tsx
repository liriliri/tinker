import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import truncate from 'licia/truncate'
import clamp from 'licia/clamp'
import { tw } from '../theme'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'pathBar'

addI18nNamespace(I18N_NS, {
  'en-US': {
    pathPlaceholder: 'Path',
    pathEllipsis: 'Show parent folders',
  },
  'zh-CN': {
    pathPlaceholder: '路径',
    pathEllipsis: '显示上级目录',
  },
})

export interface PathBarItem {
  name: string
  path: string
}

function getVisiblePathBarItems(
  items: PathBarItem[],
  startIndex: number
): { ellipsisPath: string | null; visible: PathBarItem[] } {
  const start = clamp(startIndex, 0, items.length - 1)
  if (start === 0) {
    return { ellipsisPath: null, visible: items }
  }

  return {
    ellipsisPath: items[start - 1]?.path ?? null,
    visible: items.slice(start),
  }
}

export interface PathBarProps {
  path: string
  items: PathBarItem[]
  onNavigate: (path: string) => void
  onEdit?: () => void
  formatSegment?: (item: PathBarItem) => string
}

const BLANK_MIN_WIDTH = 16
const ITEMS_PADDING = 16
const CHEVRON_GAP = 16

function getElementWidth(el: Element): number {
  if (el instanceof HTMLElement) {
    const width = el.offsetWidth || el.getBoundingClientRect().width
    if (width > 0) return width
  }
  return el.getBoundingClientRect().width
}

function renderMeasureSegments(
  segments: PathBarItem[],
  formatSegment: (item: PathBarItem) => string
) {
  return segments.map((item, index) => (
    <Fragment key={item.path}>
      {index > 0 && <ChevronRight size={12} className="shrink-0" />}
      <span data-segment className="shrink-0 whitespace-nowrap px-0.5">
        {formatSegment(item)}
      </span>
    </Fragment>
  ))
}

function measureCollapsedWidth(
  segmentWidths: number[],
  chevronGap: number,
  ellipsisPrefixWidth: number,
  start: number
): number {
  if (segmentWidths.length === 0) return ITEMS_PADDING

  if (start === 0) {
    let total = ITEMS_PADDING
    for (let i = 0; i < segmentWidths.length; i++) {
      if (i > 0) total += chevronGap
      total += segmentWidths[i]!
    }
    return total
  }

  let total = ITEMS_PADDING + ellipsisPrefixWidth
  for (let i = start; i < segmentWidths.length; i++) {
    if (i > start) total += chevronGap
    total += segmentWidths[i]!
  }
  return total
}

function findCollapseStart(
  fullWidth: number,
  segmentWidths: number[],
  chevronGap: number,
  ellipsisPrefixWidth: number,
  available: number
): number {
  if (fullWidth <= available) return 0

  for (let start = 1; start < segmentWidths.length; start++) {
    if (
      measureCollapsedWidth(
        segmentWidths,
        chevronGap,
        ellipsisPrefixWidth,
        start
      ) <= available
    ) {
      return start
    }
  }

  return Math.max(segmentWidths.length - 1, 0)
}

export default function PathBar({
  path,
  items,
  onNavigate,
  onEdit,
  formatSegment = (item) => truncate(item.name, 28),
}: PathBarProps) {
  const { t } = useTranslation(I18N_NS)
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [startIndex, setStartIndex] = useState(0)
  const [lastItemMaxWidth, setLastItemMaxWidth] = useState<number>()

  const remeasure = useCallback(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure || items.length === 0) return

    const containerWidth = container.clientWidth
    if (containerWidth <= BLANK_MIN_WIDTH) return

    const fullRow = measure.querySelector('[data-full-path]')
    const segmentEls = measure.querySelectorAll('[data-segment]')
    if (!fullRow || segmentEls.length === 0) return

    const available = containerWidth - BLANK_MIN_WIDTH
    const fullWidth = getElementWidth(fullRow)
    const segmentWidths = Array.from(segmentEls).map((el) =>
      getElementWidth(el)
    )
    const ellipsisEl = measure.querySelector('[data-ellipsis-prefix]')
    const ellipsisPrefixWidth = ellipsisEl
      ? getElementWidth(ellipsisEl) + 4
      : CHEVRON_GAP

    const nextStart = findCollapseStart(
      fullWidth,
      segmentWidths,
      CHEVRON_GAP,
      ellipsisPrefixWidth,
      available
    )
    const collapsedWidth = measureCollapsedWidth(
      segmentWidths,
      CHEVRON_GAP,
      ellipsisPrefixWidth,
      nextStart
    )
    const lastSegmentWidth = segmentWidths[items.length - 1] ?? 0

    setStartIndex(nextStart)
    setLastItemMaxWidth(
      nextStart > 0 && collapsedWidth > available && lastSegmentWidth > 0
        ? Math.max(available - (collapsedWidth - lastSegmentWidth), 48)
        : undefined
    )
  }, [items, formatSegment])

  useLayoutEffect(() => {
    remeasure()
  }, [remeasure, items])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(remeasure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [remeasure])

  const { ellipsisPath, visible } = getVisiblePathBarItems(items, startIndex)

  const showEllipsisMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    const hidden = items.slice(0, startIndex)
    if (hidden.length === 0) return

    tinker.showContextMenu(
      event.clientX,
      event.clientY,
      hidden.map((item) => ({
        label: formatSegment(item),
        click: () => onNavigate(item.path),
      }))
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex min-w-0 flex-1 items-stretch overflow-hidden rounded border text-xs ${tw.border} ${tw.bg.input}`}
    >
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute left-0 top-0 -z-10 w-max"
        aria-hidden
      >
        <div
          data-full-path
          className="inline-flex w-max items-center gap-1 whitespace-nowrap px-2"
        >
          {renderMeasureSegments(items, formatSegment)}
        </div>
        <div
          data-ellipsis-prefix
          className="inline-flex w-max items-center gap-1 whitespace-nowrap"
        >
          <span className="shrink-0 px-0.5">…</span>
          <ChevronRight size={12} className="shrink-0" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 overflow-hidden px-2 py-1">
        {ellipsisPath && (
          <>
            <button
              type="button"
              className={`shrink-0 rounded px-0.5 transition-colors ${tw.text.secondary} ${tw.hover} ${tw.primary.textHover}`}
              title={t('pathEllipsis')}
              aria-label={t('pathEllipsis')}
              onClick={showEllipsisMenu}
            >
              …
            </button>
            <ChevronRight
              size={12}
              className={`shrink-0 ${tw.text.tertiary}`}
            />
          </>
        )}
        {visible.map((item, index) => {
          const isLast = index === visible.length - 1

          return (
            <Fragment key={item.path}>
              {index > 0 && (
                <ChevronRight
                  size={12}
                  className={`shrink-0 ${tw.text.tertiary}`}
                />
              )}
              <button
                type="button"
                className={`shrink-0 rounded px-0.5 transition-colors ${
                  isLast
                    ? `min-w-0 truncate ${tw.text.primary}`
                    : `whitespace-nowrap ${tw.text.secondary} ${tw.hover} ${tw.primary.textHover}`
                }`}
                style={
                  isLast && lastItemMaxWidth
                    ? { maxWidth: lastItemMaxWidth }
                    : undefined
                }
                title={item.path}
                onClick={() => onNavigate(item.path)}
              >
                {formatSegment(item)}
              </button>
            </Fragment>
          )
        })}
      </div>
      <button
        type="button"
        className="min-w-4 flex-1 cursor-text border-0 bg-transparent px-2 py-1"
        title={path}
        aria-label={t('pathPlaceholder')}
        onClick={onEdit}
      />
    </div>
  )
}
