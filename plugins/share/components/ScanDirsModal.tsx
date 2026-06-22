import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
} from 'ag-grid-community'
import { FolderPlus, Trash2 } from 'lucide-react'
import contain from 'licia/contain'
import { tw } from '../theme'
import { addI18nNamespace } from '../lib/i18n'
import Dialog, { DialogButton } from './Dialog'
import Grid from './Grid'
import Checkbox from './Checkbox'

const I18N_NS = 'scanDirsModal'

addI18nNamespace(I18N_NS, {
  'en-US': {
    addScanDir: 'Add Folder',
    scanDirPath: 'Folder',
    removeScanDir: 'Remove Folder',
    emptyScanDirs: 'No folders',
    scan: 'Scan',
  },
  'zh-CN': {
    addScanDir: '添加文件夹',
    scanDirPath: '文件夹',
    removeScanDir: '移除文件夹',
    emptyScanDirs: '暂无文件夹',
    scan: '扫描',
  },
})

interface ScanDirRow {
  path: string
  checked: boolean
}

export interface ScanDirsModalProps {
  open: boolean
  isDark: boolean
  isScanning: boolean
  scanDirs: string[]
  scanDirChecked: string[]
  title: string
  onClose: () => void
  onAddDir: (dir: string) => void
  onRemoveDir: (dir: string) => void
  onToggleChecked: (dir: string) => void
  onScan: (checkedDirs: string[]) => void | Promise<void>
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
  const { t } = useTranslation(I18N_NS)
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

export default function ScanDirsModal({
  open,
  isDark,
  isScanning,
  scanDirs,
  scanDirChecked,
  title,
  onClose,
  onAddDir,
  onRemoveDir,
  onToggleChecked,
  onScan,
}: ScanDirsModalProps) {
  const { t } = useTranslation(I18N_NS)

  const handleAddDir = async () => {
    const result = await tinker.showOpenDialog({
      title,
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return
    onAddDir(result.filePaths[0])
  }

  const handleRemoveDir = useCallback(
    (dir: string) => {
      onRemoveDir(dir)
    },
    [onRemoveDir]
  )

  const toggleChecked = useCallback(
    (dir: string) => {
      onToggleChecked(dir)
    },
    [onToggleChecked]
  )

  const handleScan = async () => {
    onClose()
    await onScan(scanDirChecked)
  }

  const rowData = useMemo<ScanDirRow[]>(
    () =>
      scanDirs.map((path) => ({
        path,
        checked: contain(scanDirChecked, path),
      })),
    [scanDirs, scanDirChecked]
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
      open={open}
      onClose={onClose}
      title={title}
      showClose
      className="w-[520px] max-w-full"
    >
      <div className="flex flex-col">
        <div className={`h-[280px] border rounded ${tw.border}`}>
          <Grid<ScanDirRow>
            isDark={isDark}
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
            disabled={isScanning || scanDirChecked.length === 0}
          >
            {t('scan')}
          </DialogButton>
        </div>
      </div>
    </Dialog>
  )
}
