import {
  useEffect,
  useRef,
  useCallback,
  useState,
  type CSSProperties,
} from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import type { IFileEntry } from '../../common/types'
import type Explorer from '../store/Explorer'
import store from '../store'
import FileEntryIcon from './FileEntryIcon'
import { showEntryContextMenu, showBlankContextMenu } from '../lib/contextMenu'
import { useSelectAll } from '../hooks/useSelectAll'

const ICON_SIZE = 48
const ITEM_SIZE = ICON_SIZE + 16
const GAP = 20

interface FileGridProps {
  tab: Explorer
}

interface GridItemProps {
  entry: IFileEntry
  index: number
  selected: boolean
  flexLayout: boolean
  onSelect: (
    index: number,
    path: string,
    modifiers: { shift: boolean; ctrlOrMeta: boolean }
  ) => void
  onActivate: (entry: IFileEntry) => void
  onContextMenu: (event: React.MouseEvent, path: string) => void
}

function GridItem({
  entry,
  index,
  selected,
  flexLayout,
  onSelect,
  onActivate,
  onContextMenu,
}: GridItemProps) {
  return (
    <div
      title={entry.name}
      data-file-entry=""
      className={`flex flex-col items-center justify-center aspect-square w-16 box-border select-none ${
        flexLayout ? 'mr-5' : ''
      }`}
      onClick={(e) =>
        onSelect(index, entry.path, {
          shift: e.shiftKey,
          ctrlOrMeta: e.metaKey || e.ctrlKey,
        })
      }
      onDoubleClick={() => onActivate(entry)}
      onContextMenu={(e) => {
        e.stopPropagation()
        onContextMenu(e, entry.path)
      }}
    >
      <div
        className={`flex items-center justify-center w-16 h-16 p-2 mb-0.5 rounded overflow-hidden ${
          selected ? tw.bg.border : ''
        }`}
      >
        <FileEntryIcon
          path={entry.path}
          isDirectory={entry.isDirectory}
          size={ICON_SIZE}
          className="h-full w-full object-contain"
        />
      </div>
      <div
        className={`w-[120%] text-center text-xs leading-[1.4] h-[2.8em] ${
          selected ? tw.primary.text : tw.text.primary
        }`}
      >
        <div className="line-clamp-2 break-words">{entry.name}</div>
      </div>
    </div>
  )
}

export default observer(function FileGrid({ tab }: FileGridProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{
    flexLayout: boolean
    style: CSSProperties
  }>({
    flexLayout: false,
    style: { paddingLeft: GAP / 2, paddingRight: GAP / 2 },
  })

  const handleSelect = useCallback(
    (
      index: number,
      path: string,
      modifiers: { shift: boolean; ctrlOrMeta: boolean }
    ) => {
      tab.handleRowSelect(index, path, modifiers)
    },
    [tab]
  )

  const handleActivate = useCallback(
    (entry: IFileEntry) => {
      void store.activateEntry(tab.id, entry.path, entry.isDirectory)
    },
    [tab.id]
  )

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, clickedPath: string) => {
      showEntryContextMenu(event.nativeEvent, tab, clickedPath, t, {
        onCopy: () => store.copySelection(tab.id),
        onCut: () => store.cutSelection(tab.id),
        onOpenInTerminal: (path, isDir) =>
          store.openInIntegratedTerminal(path, isDir),
        onTrash: (paths) => {
          void store.trashPaths(tab.id, paths)
        },
        onRename: (path, newName) => store.renameEntry(tab.id, path, newName),
      })
    },
    [tab, t]
  )

  const handleBlankContextMenu = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-file-entry]')) return

      showBlankContextMenu(event.nativeEvent, tab, t, {
        canPaste: store.hasClipboard && store.canPasteTo(tab.path),
        onPaste: () => {
          void store.pasteClipboard(tab.id)
        },
        onOpenInTerminal: () => store.openInIntegratedTerminal(tab.path, true),
        onCreateFolder: (name) => store.createFolder(tab.id, name),
      })
    },
    [tab, t]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateLayout = () => {
      const containerWidth = container.clientWidth
      const itemCount = tab.visibleEntries.length
      const columnCount = Math.max(
        1,
        Math.floor(containerWidth / (ITEM_SIZE + GAP))
      )

      if (itemCount > columnCount) {
        const gap = Math.floor(
          (containerWidth - columnCount * ITEM_SIZE) / columnCount
        )
        setLayout({
          flexLayout: false,
          style: {
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            gap: `${GAP}px ${gap}px`,
            paddingLeft: gap / 2,
            paddingRight: gap / 2,
            paddingBottom: GAP,
          },
        })
        return
      }

      setLayout({
        flexLayout: true,
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          paddingLeft: GAP / 2,
          paddingRight: GAP / 2,
        },
      })
    }

    updateLayout()
    const observer = new ResizeObserver(updateLayout)
    observer.observe(container)
    return () => observer.disconnect()
  }, [tab.visibleEntries.length])

  useEffect(() => {
    if (tab.loading) return

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
    })
  }, [tab.path, tab.loading])

  useSelectAll(tab, store.activeTabId === tab.id)

  if (tab.error) {
    return (
      <div
        className={`flex items-center justify-center h-full text-sm px-4 text-center ${tw.text.tertiary}`}
      >
        {tab.error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden relative py-2"
      onContextMenu={handleBlankContextMenu}
    >
      {tab.loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingCircle />
        </div>
      )}
      {!tab.loading && tab.visibleEntries.length === 0 ? (
        <div
          className={`flex items-center justify-center h-full text-sm ${tw.text.tertiary}`}
        >
          {tab.isFiltering ? t('noFilterResults') : t('emptyFolder')}
        </div>
      ) : (
        <div style={layout.style}>
          {tab.visibleEntries.map((entry, index) => (
            <GridItem
              key={entry.path}
              entry={entry}
              index={index}
              selected={tab.selectedPaths.includes(entry.path)}
              flexLayout={layout.flexLayout}
              onSelect={handleSelect}
              onActivate={handleActivate}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
})
