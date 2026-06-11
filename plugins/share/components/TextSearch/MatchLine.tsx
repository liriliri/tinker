import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { tw } from '../../theme'
import className from 'licia/className'
import { buildSegments } from '../../lib/textSearch'
import { useTextSearchContext } from './context'
import { TEXT_SEARCH_NS } from './i18n'

interface MatchLineProps {
  filePath: string
  result: tinker.SearchTextResult
}

export default function MatchLine({ filePath, result }: MatchLineProps) {
  const { t } = useTranslation(TEXT_SEARCH_NS)
  const {
    activeMatchKey,
    onSelectMatch,
    onActiveMatchKeyChange,
    onCopyPath,
    onShowInFolder,
  } = useTextSearchContext()
  const key = `${filePath}:${result.lineNumber}`
  const isActive = activeMatchKey === key

  const segments = useMemo(
    () => buildSegments(result.text, result.submatches),
    [result.text, result.submatches]
  )

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
        'flex items-center py-0.5 cursor-pointer text-xs',
        isActive ? tw.active : tw.hover
      )}
      style={{ paddingLeft: 30, paddingRight: 8 }}
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
        {segments.map((seg, idx) =>
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
