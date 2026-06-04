import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import splitPath from 'licia/splitPath'
import ltrim from 'licia/ltrim'
import { tw } from '../../theme'
import type { TextSearchFileGroup } from '../../lib/textSearch'
import MatchLine from './MatchLine'
import { useTextSearchContext } from './context'
import { TEXT_SEARCH_NS } from './i18n'

interface FileGroupProps {
  group: TextSearchFileGroup
  collapsed: boolean
}

export default function FileGroup({ group, collapsed }: FileGroupProps) {
  const { t } = useTranslation(TEXT_SEARCH_NS)
  const { rootDir, onToggleCollapse, onShowInFolder, onCopyPath } =
    useTextSearchContext()
  const { name, dir } = splitPath(group.path)
  const relativeDir = rootDir
    ? dir.startsWith(rootDir)
      ? ltrim(dir.slice(rootDir.length), ['/', '\\']) || '.'
      : dir
    : dir

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('showInFolder'),
        click: () => onShowInFolder(group.path),
      },
      {
        label: t('copyPath'),
        click: () => onCopyPath(group.path),
      },
    ])
  }

  return (
    <div>
      <div
        onClick={() => onToggleCollapse(group.path)}
        onContextMenu={handleContextMenu}
        className={`flex items-center py-0.5 cursor-pointer text-xs ${tw.hover}`}
        style={{ paddingLeft: 8, paddingRight: 8 }}
      >
        <span className="shrink-0 mr-1 w-3.5 h-3.5 flex items-center justify-center">
          {collapsed ? (
            <ChevronRight size={14} className={tw.text.tertiary} />
          ) : (
            <ChevronDown size={14} className={tw.text.tertiary} />
          )}
        </span>
        <FileText size={14} className={`shrink-0 mr-1.5 ${tw.text.tertiary}`} />
        <span
          className={`truncate font-medium ${tw.text.primary}`}
          title={group.path}
        >
          {name}
        </span>
        <span
          className={`ml-1.5 truncate ${tw.text.tertiary}`}
          title={group.path}
        >
          {relativeDir}
        </span>
        <span
          className={`ml-auto shrink-0 px-1.5 rounded-full text-[10px] tabular-nums ${tw.bg.tertiary} ${tw.text.secondary}`}
        >
          {group.matches.length}
        </span>
      </div>
      {!collapsed && (
        <div>
          {group.matches.map((m, idx) => (
            <MatchLine
              key={`${m.lineNumber}-${idx}`}
              filePath={group.path}
              result={m}
            />
          ))}
        </div>
      )}
    </div>
  )
}
