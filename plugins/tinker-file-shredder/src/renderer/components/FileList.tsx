import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback, useEffect } from 'react'
import type {
  ColDef,
  ICellRendererParams,
  CellContextMenuEvent,
} from 'ag-grid-community'
import type { MenuItemConstructorOptions } from 'electron'
import fileSize from 'licia/fileSize'
import Grid from 'share/components/Grid'
import { tw } from 'share/theme'
import type { FileEntry } from '../../common/types'
import store from '../store'

const NameCell = observer(function NameCell({
  data,
}: ICellRendererParams<FileEntry>) {
  if (!data) return null

  useEffect(() => {
    if (!store.iconCache.has(data.path)) {
      store.loadFileIcon(data.path)
    }
  }, [data.path])

  const icon = store.iconCache.get(data.path)

  return (
    <div className="flex items-center gap-2">
      {icon ? (
        <img src={icon} alt="" className="w-4 h-4 flex-shrink-0" />
      ) : (
        <span className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="truncate">{data.name}</span>
    </div>
  )
})

const PathCell = ({ data }: ICellRendererParams<FileEntry>) => {
  if (!data) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    tinker.showItemInPath(data.path)
  }

  return (
    <span
      className="cursor-pointer hover:underline"
      onClick={handleClick}
      title={data.path}
    >
      {data.path}
    </span>
  )
}

const StatusCell = observer(function StatusCell({
  data,
}: ICellRendererParams<FileEntry>) {
  const { t } = useTranslation()
  if (!data) return null

  if (data.status === 'shredding') {
    return (
      <div className="flex items-center gap-2 h-full">
        <div
          className={`flex-1 h-1.5 rounded-full overflow-hidden ${tw.bg.tertiary}`}
        >
          <div
            className={`h-full ${tw.primary.bg}`}
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <span className={`text-xs tabular-nums ${tw.text.secondary}`}>
          {data.progress}%
        </span>
      </div>
    )
  }

  const label =
    data.status === 'error'
      ? data.error === 'Cancelled'
        ? t('statusCancelled')
        : data.error || t('statusError')
      : t('statusPending')

  return (
    <span
      className={`truncate ${
        data.status === 'error' ? tw.diff.statDelete : tw.text.secondary
      }`}
      title={label}
    >
      {label}
    </span>
  )
})

export default observer(function FileList() {
  const { t } = useTranslation()

  const onCellContextMenu = useCallback(
    (event: CellContextMenuEvent<FileEntry>) => {
      if (!event.data || !event.event || store.shredding) return

      const file = event.data
      const e = event.event as MouseEvent
      e.preventDefault()

      const items: MenuItemConstructorOptions[] = [
        {
          label: t('showInFolder'),
          click: () => tinker.showItemInPath(file.path),
        },
      ]

      if (file.status === 'pending') {
        items.push(
          { type: 'separator' },
          {
            label: t('remove'),
            click: () => store.removeFile(file.path),
          }
        )
      }

      tinker.showContextMenu(e.clientX, e.clientY, items)
    },
    [t]
  )

  const columnDefs = useMemo(
    (): ColDef<FileEntry>[] => [
      {
        field: 'name',
        headerName: t('fileName'),
        flex: 2,
        minWidth: 150,
        sortable: false,
        cellRenderer: NameCell,
      },
      {
        field: 'path',
        headerName: t('filePath'),
        flex: 3,
        minWidth: 200,
        sortable: false,
        cellRenderer: PathCell,
      },
      {
        field: 'size',
        headerName: t('fileSize'),
        width: 120,
        sortable: false,
        cellStyle: { textAlign: 'right' },
        valueFormatter: (params) =>
          params.value != null ? fileSize(params.value) : '',
      },
      {
        field: 'status',
        headerName: t('status'),
        flex: 1,
        minWidth: 160,
        sortable: false,
        cellRenderer: StatusCell,
      },
    ],
    [t]
  )

  const getRowId = useCallback(
    (params: { data: FileEntry }) => params.data.path,
    []
  )

  return (
    <div className="flex-1 overflow-hidden">
      <Grid<FileEntry>
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={store.files}
        getRowId={getRowId}
        onCellContextMenu={onCellContextMenu}
        preventDefaultOnContextMenu={true}
        suppressCellFocus={true}
        overlayNoRowsTemplate={`<span>${t('noFiles')}</span>`}
      />
    </div>
  )
})
