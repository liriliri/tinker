import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback, useEffect } from 'react'
import type {
  ColDef,
  ICellRendererParams,
  RowDoubleClickedEvent,
  SelectionChangedEvent,
  CellContextMenuEvent,
  BodyScrollEndEvent,
} from 'ag-grid-community'
import copy from 'licia/copy'
import dateFormat from 'licia/dateFormat'
import fileSize from 'licia/fileSize'
import splitPath from 'licia/splitPath'
import Grid from 'share/components/Grid'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Checkbox from 'share/components/Checkbox'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import store from '../store'
import type { FileResult } from '../types'

const NameCell = observer(function NameCell({
  data,
}: ICellRendererParams<FileResult>) {
  if (!data) return null

  useEffect(() => {
    if (!store.iconCache.has(data.path)) {
      store.loadFileIcon(data.path)
    }
  }, [data.path])

  const icon = store.iconCache.get(data.path)
  const name = splitPath(data.path).name

  return (
    <div className="flex items-center gap-2">
      {icon ? (
        <img src={icon} alt="" className="w-4 h-4 flex-shrink-0" />
      ) : (
        <span className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="truncate">{name}</span>
    </div>
  )
})

const PathCell = ({ data }: ICellRendererParams<FileResult>) => {
  if (!data) return null

  const dir = splitPath(data.path).dir

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    tinker.showItemInPath(data.path)
  }

  return (
    <span
      className="truncate cursor-pointer hover:underline"
      onClick={handleClick}
      title={data.path}
    >
      {dir}
    </span>
  )
}

export default observer(function ResultView() {
  const { t } = useTranslation()

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<FileResult>) => {
      const rows = event.api.getSelectedRows()
      store.setSelectedFile(rows[0] ?? null)
    },
    []
  )

  const columnDefs: ColDef<FileResult>[] = useMemo(() => {
    const cols: ColDef<FileResult>[] = [
      {
        field: 'path',
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
        colId: 'pathCol',
      },
    ]

    if (!store.showPreview) {
      cols.push(
        {
          field: 'size',
          headerName: t('fileSize'),
          width: 100,
          sortable: false,
          cellStyle: { textAlign: 'right' },
          valueFormatter: (params) =>
            params.value ? fileSize(params.value) : '',
        },
        {
          field: 'dateModified',
          headerName: t('dateModified'),
          width: 150,
          sortable: false,
          valueFormatter: (params) =>
            params.value
              ? dateFormat(new Date(params.value), 'yyyy-mm-dd HH:MM')
              : '',
        }
      )
    }

    return cols
  }, [t, store.showPreview])

  const getRowId = useCallback(
    (params: { data: FileResult }) => params.data.path,
    []
  )

  const onRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<FileResult>) => {
      if (event.data) {
        tinker.showItemInPath(event.data.path)
      }
    },
    []
  )

  const onCellContextMenu = useCallback(
    (event: CellContextMenuEvent<FileResult>) => {
      if (!event.data) return
      const filePath = event.data.path
      const e = event.event as MouseEvent
      e.preventDefault()
      tinker.showContextMenu(e.clientX, e.clientY, [
        {
          label: t('showInFolder'),
          click: () => tinker.showItemInPath(filePath),
        },
        {
          label: t('copyPath'),
          click: () => copy(filePath),
        },
        { type: 'separator' },
        {
          label: t('delete'),
          click: () => store.requestDelete(filePath),
        },
      ])
    },
    [t]
  )

  const onBodyScrollEnd = useCallback(
    (event: BodyScrollEndEvent<FileResult>) => {
      if (!store.hasMore || store.searching) return

      const { top, bottom } = event.api.getVerticalPixelRange()
      const totalHeight = event.api.getDisplayedRowCount() * 40
      if (bottom >= totalHeight - (bottom - top) / 2) {
        store.loadMore()
      }
    },
    []
  )

  const handleConfirmDelete = useCallback(async () => {
    const success = await store.confirmDelete()
    if (success) {
      toast.success(t('deleteSuccess'))
    } else {
      toast.error(t('deleteError'))
    }
  }, [t])

  const pendingFileName = store.pendingDeletePath
    ? splitPath(store.pendingDeletePath).name
    : ''

  return (
    <div className="flex-1 overflow-hidden">
      <Grid<FileResult>
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={store.results}
        getRowId={getRowId}
        rowSelection={{
          mode: 'singleRow',
          checkboxes: false,
          enableClickSelection: true,
        }}
        onSelectionChanged={onSelectionChanged}
        onRowDoubleClicked={onRowDoubleClicked}
        onCellContextMenu={onCellContextMenu}
        onBodyScrollEnd={onBodyScrollEnd}
        suppressCellFocus={true}
        overlayNoRowsTemplate={`<span>${t('noResults')}</span>`}
      />
      <Dialog
        open={!!store.pendingDeletePath}
        onClose={() => store.cancelDelete()}
        title={t('confirmDelete')}
      >
        <p className={`text-sm ${tw.text.secondary} mb-4`}>
          {t('confirmDeleteMessage', { name: pendingFileName })}
        </p>
        <Checkbox
          checked={store.moveToTrash}
          onChange={(checked) => store.setMoveToTrash(checked)}
          className="mb-6"
        >
          {t('moveToTrash')}
        </Checkbox>
        <div className="flex gap-2 justify-end">
          <DialogButton variant="text" onClick={() => store.cancelDelete()}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleConfirmDelete}>
            {t('confirm')}
          </DialogButton>
        </div>
      </Dialog>
    </div>
  )
})
