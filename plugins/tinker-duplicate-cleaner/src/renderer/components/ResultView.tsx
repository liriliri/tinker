import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback, useState } from 'react'
import type {
  ColDef,
  ICellRendererParams,
  IsFullWidthRowParams,
  RowClickedEvent,
} from 'ag-grid-community'
import fileSize from 'licia/fileSize'
import { ChevronRight, ChevronDown } from 'lucide-react'
import Grid from 'share/components/Grid'
import Checkbox from 'share/components/Checkbox'
import store from '../store'

interface GroupRow {
  type: 'group'
  id: string
  groupIndex: number
  size: number
  count: number
  firstName: string
}

interface FileRow {
  type: 'file'
  id: string
  groupIndex: number
  name: string
  path: string
  size: number
}

type RowData = GroupRow | FileRow

function isGroupRow(row: RowData): row is GroupRow {
  return row.type === 'group'
}

function buildRows(expandedGroups: Set<number>): RowData[] {
  const rows: RowData[] = []
  store.filteredGroups.forEach((group, i) => {
    rows.push({
      type: 'group',
      id: `group-${i}`,
      groupIndex: i,
      size: group.size,
      count: group.files.length,
      firstName: group.files[0]?.name ?? '',
    })
    if (expandedGroups.has(i)) {
      for (const file of group.files) {
        rows.push({
          type: 'file',
          id: file.path,
          groupIndex: i,
          name: file.name,
          path: file.path,
          size: file.size,
        })
      }
    }
  })
  return rows
}

const CheckboxCell = observer(function CheckboxCell({
  data,
}: ICellRendererParams<RowData>) {
  if (!data || isGroupRow(data)) return null

  return (
    <div className="flex items-center justify-center" style={{ height: 36 }}>
      <Checkbox
        checked={store.selectedFiles.has(data.path)}
        onChange={() => store.toggleFile(data.path)}
      />
    </div>
  )
})

const PathCell = ({ data }: ICellRendererParams<RowData>) => {
  if (!data || isGroupRow(data)) return null

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

interface GroupCellProps {
  data: GroupRow
  expanded: boolean
}

function GroupCellRenderer({ data, expanded }: GroupCellProps) {
  const Icon = expanded ? ChevronDown : ChevronRight
  const totalSize = data.size * data.count
  return (
    <div className="flex items-center gap-2 px-3 h-full cursor-pointer select-none">
      <Icon size={14} className="flex-shrink-0" />
      <span className="font-medium">
        {data.firstName} ({data.count})
      </span>
      <span className="ml-auto text-sm opacity-70">{fileSize(totalSize)}</span>
    </div>
  )
}

export default observer(function ResultView() {
  const { t } = useTranslation()
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    () => new Set()
  )

  const rowData = useMemo(
    () => buildRows(expandedGroups),
    [store.filteredGroups, expandedGroups]
  )

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        headerName: '',
        width: 50,
        sortable: false,
        cellRenderer: CheckboxCell,
        suppressMovable: true,
      },
      {
        field: 'name' as const,
        headerName: t('fileName'),
        flex: 2,
        minWidth: 150,
        sortable: false,
      },
      {
        field: 'path' as const,
        headerName: t('filePath'),
        flex: 3,
        minWidth: 200,
        sortable: false,
        cellRenderer: PathCell,
      },
      {
        field: 'size' as const,
        headerName: t('fileSize'),
        width: 120,
        sortable: false,
        cellStyle: { textAlign: 'right' },
        valueFormatter: (params) =>
          params.data && !isGroupRow(params.data) ? fileSize(params.value) : '',
      },
    ],
    [t]
  )

  const getRowId = useCallback(
    (params: { data: RowData }) => params.data.id,
    []
  )

  const isFullWidthRow = useCallback(
    (params: IsFullWidthRowParams<RowData>) =>
      !!params.rowNode.data && isGroupRow(params.rowNode.data),
    []
  )

  const fullWidthCellRenderer = useCallback(
    (params: ICellRendererParams<RowData>) => {
      if (!params.data || !isGroupRow(params.data)) return null
      return (
        <GroupCellRenderer
          data={params.data}
          expanded={expandedGroups.has(params.data.groupIndex)}
        />
      )
    },
    [expandedGroups]
  )

  const onRowClicked = useCallback((event: RowClickedEvent<RowData>) => {
    if (!event.data || !isGroupRow(event.data)) return
    const idx = event.data.groupIndex
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }, [])

  return (
    <div className="flex-1 overflow-hidden">
      <Grid<RowData>
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={rowData}
        getRowId={getRowId}
        headerHeight={36}
        rowHeight={36}
        isFullWidthRow={isFullWidthRow}
        fullWidthCellRenderer={fullWidthCellRenderer}
        onRowClicked={onRowClicked}
        enableCellTextSelection={true}
        suppressCellFocus={true}
        overlayNoRowsTemplate={`<span>${t('noRows')}</span>`}
      />
    </div>
  )
})
