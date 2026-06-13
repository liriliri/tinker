import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from '../../theme'
import className from 'licia/className'
import type { TextSearchSegment } from '../../lib/textSearch'
import { useTextSearchContext } from './context'
import { TEXT_SEARCH_NS } from './i18n'
import { TEXT_SEARCH_ROW_HEIGHT } from './rows'

interface MatchLineProps {
  filePath: string
  result: tinker.SearchTextResult
  segments: TextSearchSegment[]
  isActive: boolean
}

function MatchLine({ filePath, result, segments, isActive }: MatchLineProps) {
  const { t } = useTranslation(TEXT_SEARCH_NS)
  const { onSelectMatch, onActiveMatchKeyChange, onCopyPath, onShowInFolder } =
    useTextSearchContext()
  const key = `${filePath}:${result.lineNumber}`

  const handleClick = () => {
    onActiveMatchKeyChange(key)
    onSelectMatch?.({ ...result, path: filePath })
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('copyLine'),
        click: () => {
          navigator.clipboard.writeText(result.text)
        },
      },
      {
        label: t('copyPath'),
        click: () => onCopyPath(filePath),
      },
      { type: 'separator' },
      {
        label: t('showInFolder'),
        click: () => onShowInFolder(filePath),
      },
    ])
  }

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={className(
        'flex items-center cursor-pointer text-xs',
        isActive ? tw.active : tw.hover
      )}
      style={{
        height: TEXT_SEARCH_ROW_HEIGHT,
        paddingLeft: 30,
        paddingRight: 8,
      }}
    >
      <span
        className={`shrink-0 mr-2 tabular-nums ${tw.text.tertiary} text-[11px]`}
        style={{ minWidth: 28, textAlign: 'right' }}
      >
        {result.lineNumber}
      </span>
      <span
        className={`truncate font-mono ${tw.text.primary}`}
        title={result.text.trim()}
      >
        {segments.length === 1 && !segments[0].matched
          ? segments[0].text
          : segments.map((seg, idx) =>
              seg.matched ? (
                <span key={idx} className="tts-match-inline rounded-sm">
                  {seg.text}
                </span>
              ) : (
                <span key={idx}>{seg.text}</span>
              )
            )}
      </span>
    </div>
  )
}

export default memo(MatchLine)
