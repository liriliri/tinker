import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import splitPath from 'licia/splitPath'
import ltrim from 'licia/ltrim'
import { tw } from 'share/theme'
import store from '../store'
import type { FileGroup as FileGroupData } from '../types'
import MatchLine from './MatchLine'

interface FileGroupProps {
  group: FileGroupData
}

export default observer(function FileGroup({ group }: FileGroupProps) {
  const { t } = useTranslation()
  const collapsed = store.isCollapsed(group.path)
  const { name, dir } = splitPath(group.path)
  const icon = store.iconCache.get(group.path)
  const relativeDir = store.rootDir
    ? dir.startsWith(store.rootDir)
      ? ltrim(dir.slice(store.rootDir.length), ['/', '\\']) || '.'
      : dir
    : dir

  useEffect(() => {
    if (!icon) {
      store.loadFileIcon(group.path)
    }
  }, [group.path, icon])

  const handleToggle = () => {
    store.toggleCollapse(group.path)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('showInFolder'),
        click: () => store.showInFolder(group.path),
      },
      {
        label: t('copyPath'),
        click: () => store.copyPath(group.path),
      },
    ])
  }

  return (
    <div>
      <div
        onClick={handleToggle}
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
        {icon ? (
          <img src={icon} alt="" className="w-4 h-4 shrink-0 mr-1.5" />
        ) : (
          <span className="w-4 h-4 shrink-0 mr-1.5" />
        )}
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
})
