import { observer } from 'mobx-react-lite'
import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
} from 'ag-grid-community'
import { FolderPlus, Trash2 } from 'lucide-react'
import contain from 'licia/contain'
import { tw } from 'share/theme'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Grid from 'share/components/Grid'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

interface ScanDirRow {
  path: string
  checked: boolean
}

interface CheckboxCellProps extends ICellRendererParams<ScanDirRow> {
  onToggle: (path: string) => void
}

interface DeleteCellProps extends ICellRendererParams<ScanDirRow> {
  onRemove: (path: string) => void
}

function CheckboxCell({ data, onToggle }: CheckboxCellProps) {
  if (!data) return null
  return (
    <div className="flex items-center justify-center h-full">
      <Checkbox checked={data.checked} onChange={() => onToggle(data.path)} />
    </div>
  )
}

function DeleteCell({ data, onRemove }: DeleteCellProps) {
  const { t } = useTranslation()
  if (!data) return null
  return (
    <button
      onClick={() => onRemove(data.path)}
      className={`p-1.5 rounded ${tw.hover} ${tw.text.tertiary}`}
      title={t('removeScanDir')}
    >
      <Trash2 size={14} />
    </button>
  )
}

const ScanDirsModal = observer(function ScanDirsModal() {
  const { t } = useTranslation()
  const isOpen = store.showScanDialog

  const handleClose = () => {
    store.hideScanDialog()
  }

  const handleAddDir = async () => {
    const result = await tinker.showOpenDialog({
      title: t('scanLocalPhotos'),
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return
    store.addScanDir(result.filePaths[0])
  }

  const handleRemoveDir = useCallback((dir: string) => {
    store.removeScanDir(dir)
  }, [])

  const toggleChecked = useCallback((dir: string) => {
    store.toggleScanDirChecked(dir)
  }, [])

  const handleScan = async () => {
    store.hideScanDialog()
    await store.scanLocalPhotos(store.scanDirChecked)
  }

  const rowData = useMemo<ScanDirRow[]>(
    () =>
      store.scanDirs.map((path) => ({
        path,
        checked: contain(store.scanDirChecked, path),
      })),
    [store.scanDirs, store.scanDirChecked]
  )

  const columnDefs = useMemo<ColDef<ScanDirRow>[]>(
    () => [
      {
        headerName: '',
        width: 50,
        sortable: false,
        suppressMovable: true,
        cellRenderer: CheckboxCell,
        cellRendererParams: {
          onToggle: toggleChecked,
        },
      },
      {
        field: 'path',
        headerName: t('scanDirPath'),
        flex: 1,
        minWidth: 200,
        sortable: false,
        tooltipField: 'path',
      },
      {
        headerName: '',
        width: 50,
        sortable: false,
        suppressMovable: true,
        cellRenderer: DeleteCell,
        cellRendererParams: {
          onRemove: handleRemoveDir,
        },
      },
    ],
    [t, toggleChecked, handleRemoveDir]
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<ScanDirRow>) => params.data.path,
    []
  )

  const localeText = useMemo(
    () => ({
      noRowsToShow: t('emptyScanDirs'),
    }),
    [t]
  )

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      title={t('scanLocalPhotos')}
      showClose
      className="w-[520px] max-w-full"
    >
      <div className="flex flex-col">
        <div className={`h-[280px] border rounded ${tw.border}`}>
          <Grid<ScanDirRow>
            isDark={store.isDark}
            columnDefs={columnDefs}
            rowData={rowData}
            getRowId={getRowId}
            defaultColDef={{
              cellStyle: { display: 'flex', alignItems: 'center' },
            }}
            suppressCellFocus={true}
            localeText={localeText}
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-4">
          <DialogButton
            variant="text"
            onClick={handleAddDir}
            className="inline-flex items-center gap-1.5"
          >
            <FolderPlus size={14} />
            {t('addScanDir')}
          </DialogButton>
          <DialogButton
            onClick={handleScan}
            disabled={store.isScanning || store.scanDirChecked.length === 0}
          >
            {t('scan')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
})

export default ScanDirsModal
