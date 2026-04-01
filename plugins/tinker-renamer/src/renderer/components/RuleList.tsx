import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import Checkbox from 'share/components/Checkbox'
import { confirm } from 'share/components/Confirm'
import {
  Toolbar as SharedToolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Grid from 'share/components/Grid'
import { AgGridReact } from 'ag-grid-react'
import {
  ColDef,
  CellStyle,
  GetRowIdParams,
  ICellRendererParams,
  RowClickedEvent,
  RowClassParams,
  RowDoubleClickedEvent,
  RowDragEndEvent,
  IRowDragItem,
} from 'ag-grid-community'
import type { RuleRow } from '../types'
import store from '../store'

const RULE_TYPE_COLORS: Record<string, string> = {
  replace: 'bg-blue-500',
  insert: 'bg-green-500',
  delete: 'bg-red-500',
  format: 'bg-purple-500',
  template: 'bg-orange-500',
}

const TypeCell = observer(({ data }: ICellRendererParams<RuleRow>) => {
  if (!data) return null

  const { t } = useTranslation()

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-white text-xs font-medium ${
        RULE_TYPE_COLORS[data.type]
      }`}
    >
      {t(data.type)}
    </span>
  )
})

const EnabledCell = observer(({ data }: ICellRendererParams<RuleRow>) => {
  if (!data) return null

  return (
    <Checkbox
      checked={data.enabled}
      onChange={() => store.toggleRule(data.id)}
    />
  )
})

export default observer(function RuleList() {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<RuleRow>>(null)

  const hasSelection = store.selectedRule !== null

  const columnDefs: ColDef<RuleRow>[] = useMemo(
    () => [
      {
        headerName: t('ruleType'),
        field: 'type',
        width: 100,
        minWidth: 80,
        maxWidth: 120,
        sortable: false,
        cellRenderer: TypeCell,
        cellStyle: { display: 'flex', alignItems: 'center' } as CellStyle,
      },
      {
        headerName: t('description'),
        field: 'description',
        flex: 1,
        minWidth: 120,
        sortable: false,
        tooltipField: 'description',
      },
      {
        headerName: t('enabled'),
        field: 'enabled',
        width: 60,
        minWidth: 60,
        maxWidth: 70,
        sortable: false,
        cellRenderer: EnabledCell,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
    ],
    [t]
  )

  const ruleRowData = store.ruleRowData(t)

  const getRowId = useCallback(
    (params: GetRowIdParams<RuleRow>) => params.data.id,
    []
  )

  const onRowClicked = useCallback((event: RowClickedEvent<RuleRow>) => {
    if (event.data) {
      store.selectRule(event.data.id)
    }
  }, [])

  const getRowClass = useCallback((params: RowClassParams<RuleRow>) => {
    if (params.data && store.selectedRule === params.data.id) {
      return 'ag-row-selected'
    }
    return ''
  }, [])

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows()
    }
  }, [store.selectedRule])

  const onRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<RuleRow>) => {
      if (event.data) {
        store.openEditRuleDialog(event.data.rule)
      }
    },
    []
  )

  const onRowDragEnd = useCallback((event: RowDragEndEvent<RuleRow>) => {
    const { node, overNode } = event
    if (!overNode || node.id === overNode.id) return
    const fromId = node.data?.id
    const toId = overNode.data?.id
    if (!fromId || !toId) return
    const fromIndex = store.rules.findIndex((r) => r.id === fromId)
    const toIndex = store.rules.findIndex((r) => r.id === toId)
    if (fromIndex !== -1 && toIndex !== -1) {
      store.reorderRule(fromIndex, toIndex)
    }
  }, [])

  const addRuleMenu = useMemo(
    () => [
      { label: t('replace'), click: () => store.openAddRuleDialog('replace') },
      { label: t('insert'), click: () => store.openAddRuleDialog('insert') },
      { label: t('delete'), click: () => store.openAddRuleDialog('delete') },
      { label: t('format'), click: () => store.openAddRuleDialog('format') },
      {
        label: t('template'),
        click: () => store.openAddRuleDialog('template'),
      },
    ],
    [t]
  )

  const localeText = useMemo(
    () => ({
      noRowsToShow: t('noRules'),
    }),
    [t]
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <SharedToolbar className="py-0.5">
        <ToolbarButton menu={addRuleMenu} title={t('addRule')}>
          <Plus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          onClick={() => store.deleteSelectedRule()}
          disabled={!hasSelection}
          title={t('delete')}
        >
          <Trash2 size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton
          onClick={async () => {
            const ok = await confirm({
              title: t('confirmClearRules'),
              message: t('confirmClearRulesMessage'),
            })
            if (ok) store.clearRules()
          }}
          disabled={store.rules.length === 0}
          title={t('clearAll')}
        >
          <X size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarSpacer />
      </SharedToolbar>

      <div className="flex-1 overflow-hidden">
        <Grid<RuleRow>
          isDark={store.isDark}
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={ruleRowData}
          getRowId={getRowId}
          onRowClicked={onRowClicked}
          onRowDoubleClicked={onRowDoubleClicked}
          getRowClass={getRowClass}
          rowDragEntireRow={true}
          rowDragText={(params: IRowDragItem) =>
            params.rowNode?.data?.description ?? ''
          }
          onRowDragEnd={onRowDragEnd}
          headerHeight={40}
          rowHeight={40}
          animateRows={false}
          enableCellTextSelection={true}
          suppressCellFocus={true}
          localeText={localeText}
          tooltipShowDelay={500}
        />
      </div>
    </div>
  )
})
