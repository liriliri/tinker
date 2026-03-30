import { observer } from 'mobx-react-lite'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import Grid from 'share/components/Grid'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import store from '../store'
import type { KeyValuePair } from '../../common/types'

interface RowData {
  index: number
  key: string
  value: string
  enabled: boolean
  isLastEmpty: boolean
}

interface KeyValueEditorProps {
  items: KeyValuePair[]
  onUpdate: (
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean
  ) => void
  onAdd: () => void
  onRemove: (index: number) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

interface InputRendererParams {
  placeholder: string
  field: 'key' | 'value'
  onUpdate: KeyValueEditorProps['onUpdate']
  onAdd: KeyValueEditorProps['onAdd']
  itemsLength: number
}

function InputRenderer(
  params: ICellRendererParams<RowData> & InputRendererParams
) {
  const [value, setValue] = useState(params.value as string)
  const data = params.data!

  useEffect(() => {
    setValue(params.value as string)
  }, [params.value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    params.onUpdate(data.index, params.field, newValue)

    // Auto-add empty row when typing in the last empty row
    if (data.isLastEmpty && newValue !== '') {
      params.onAdd()
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={params.placeholder}
      className={`w-full h-full bg-transparent text-xs outline-none ${tw.text.primary} placeholder:${tw.text.tertiary}`}
    />
  )
}

function CheckboxRenderer(
  params: ICellRendererParams<RowData> & {
    onUpdate: KeyValueEditorProps['onUpdate']
  }
) {
  if (!params.data || params.data.isLastEmpty) return null

  return (
    <div className="flex items-center justify-center" style={{ height: 36 }}>
      <Checkbox
        checked={params.data.enabled}
        onChange={(checked) =>
          params.onUpdate(params.data!.index, 'enabled', checked)
        }
      />
    </div>
  )
}

function DeleteRenderer(
  params: ICellRendererParams<RowData> & {
    onRemove: KeyValueEditorProps['onRemove']
  }
) {
  if (!params.data || params.data.isLastEmpty) return null

  return (
    <div className="flex items-center justify-center" style={{ height: 36 }}>
      <button
        onClick={() => params.onRemove(params.data!.index)}
        className={`p-1 rounded ${tw.hover} ${tw.text.tertiary} ${tw.primary.textHover}`}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default observer(function KeyValueEditor({
  items,
  onUpdate,
  onAdd,
  onRemove,
  keyPlaceholder,
  valuePlaceholder,
}: KeyValueEditorProps) {
  const { t } = useTranslation()
  const resolvedKeyPlaceholder = keyPlaceholder || t('key')
  const resolvedValuePlaceholder = valuePlaceholder || t('value')
  const gridRef = useRef<AgGridReact<RowData>>(null)

  const rowData: RowData[] = useMemo(() => {
    const lastIndex = items.length - 1
    return items.map((item, index) => ({
      index,
      key: item.key,
      value: item.value,
      enabled: item.enabled,
      isLastEmpty: index === lastIndex && item.key === '' && item.value === '',
    }))
  }, [items.length, ...items.map((i) => `${i.key}|${i.value}|${i.enabled}`)])

  const hasEmptyLastRow =
    items.length > 0 &&
    items[items.length - 1].key === '' &&
    items[items.length - 1].value === ''

  // Ensure there's always an empty last row
  useEffect(() => {
    if (!hasEmptyLastRow) {
      onAdd()
    }
  }, [hasEmptyLastRow, onAdd])

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        headerName: '',
        field: 'enabled',
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        sortable: false,
        cellRenderer: CheckboxRenderer,
        cellRendererParams: { onUpdate },
        suppressMovable: true,
      },
      {
        headerName: resolvedKeyPlaceholder,
        field: 'key',
        flex: 1,
        minWidth: 120,
        sortable: false,
        suppressMovable: true,
        cellRenderer: InputRenderer,
        cellRendererParams: {
          placeholder: resolvedKeyPlaceholder,
          field: 'key',
          onUpdate,
          onAdd,
          itemsLength: items.length,
        },
      },
      {
        headerName: resolvedValuePlaceholder,
        field: 'value',
        flex: 1,
        minWidth: 120,
        sortable: false,
        suppressMovable: true,
        cellRenderer: InputRenderer,
        cellRendererParams: {
          placeholder: resolvedValuePlaceholder,
          field: 'value',
          onUpdate,
          onAdd,
          itemsLength: items.length,
        },
      },
      {
        headerName: '',
        field: 'index',
        width: 40,
        minWidth: 40,
        maxWidth: 40,
        sortable: false,
        cellRenderer: DeleteRenderer,
        cellRendererParams: { onRemove },
        suppressMovable: true,
      },
    ],
    [
      resolvedKeyPlaceholder,
      resolvedValuePlaceholder,
      onUpdate,
      onRemove,
      onAdd,
      items.length,
    ]
  )

  const getRowId = useCallback(
    (params: { data: RowData }) =>
      `${params.data.index}-${params.data.isLastEmpty}`,
    []
  )

  return (
    <div className="flex-1 min-h-0">
      <div className={`h-full border ${tw.border} rounded overflow-hidden`}>
        <Grid<RowData>
          ref={gridRef}
          isDark={store.isDark}
          columnDefs={columnDefs}
          rowData={rowData}
          getRowId={getRowId}
          headerHeight={32}
          rowHeight={36}
          animateRows={false}
          enableCellTextSelection={true}
          suppressCellFocus={true}
        />
      </div>
    </div>
  )
})
