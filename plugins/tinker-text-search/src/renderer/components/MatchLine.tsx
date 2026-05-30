import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { tw } from 'share/theme'
import className from 'licia/className'
import store from '../store'
import { buildSegments } from '../lib/highlight'
import type { ActiveMatch } from '../types'

interface MatchLineProps {
  filePath: string
  result: tinker.SearchTextResult
}

export default observer(function MatchLine({
  filePath,
  result,
}: MatchLineProps) {
  const { t } = useTranslation()
  const key = `${filePath}:${result.lineNumber}`
  const isActive = store.activeMatchKey === key

  const segments = useMemo(
    () => buildSegments(result.text, result.submatches),
    [result.text, result.submatches]
  )

  const handleClick = () => {
    const am: ActiveMatch = {
      path: filePath,
      lineNumber: result.lineNumber,
      text: result.text,
      submatches: result.submatches,
    }
    store.selectMatch(am)
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
        click: () => store.copyPath(filePath),
      },
      { type: 'separator' },
      {
        label: t('showInFolder'),
        click: () => store.showInFolder(filePath),
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
})
