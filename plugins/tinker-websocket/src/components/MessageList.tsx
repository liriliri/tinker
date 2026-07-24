import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'
import { AlignJustify, ArrowDown, ArrowUp, Eraser } from 'lucide-react'
import type {
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  SelectionChangedEvent,
} from 'ag-grid-community'
import Grid from 'share/components/Grid'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSearch,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import { formatMessagePreview, formatMessageTime } from '../lib/format'
import type { MessageDirection, MessageFilter, WsMessage } from '../types'

const FILTERS: {
  id: MessageFilter
  icon: typeof AlignJustify
  labelKey: string
}[] = [
  { id: 'all', icon: AlignJustify, labelKey: 'filterAll' },
  { id: 'outgoing', icon: ArrowUp, labelKey: 'filterOutgoing' },
  { id: 'incoming', icon: ArrowDown, labelKey: 'filterIncoming' },
]

function DirectionCell({ data }: ICellRendererParams<WsMessage>) {
  if (!data) return null

  const direction = data.direction as MessageDirection
  let icon
  if (direction === 'outgoing') {
    icon = <ArrowUp size={14} className={tw.primary.text} />
  } else if (direction === 'incoming') {
    icon = <ArrowDown size={14} className="text-red-500" />
  } else {
    icon = <span className={tw.text.tertiary}>·</span>
  }

  return (
    <div className="h-full w-full flex items-center justify-center">{icon}</div>
  )
}

function ContentCell({ data }: ICellRendererParams<WsMessage>) {
  const { t } = useTranslation()
  if (!data) return null

  const text = data.isBinary
    ? t('binaryMessage')
    : formatMessagePreview(data.data)

  return (
    <div
      className={`truncate ${
        data.direction === 'system' ? tw.text.tertiary : tw.text.primary
      }`}
    >
      {text}
    </div>
  )
}

export const MessageToolbar = observer(function MessageToolbar() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      {FILTERS.map((filter) => {
        const Icon = filter.icon
        return (
          <ToolbarButton
            key={filter.id}
            variant="toggle"
            active={store.messageFilter === filter.id}
            onClick={() => store.setMessageFilter(filter.id)}
            className="px-2 py-1 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Icon size={TOOLBAR_ICON_SIZE} />
              {t(filter.labelKey)}
            </div>
          </ToolbarButton>
        )
      })}

      <ToolbarSeparator />

      <ToolbarSearch
        value={store.messageSearch}
        onChange={(value) => store.setMessageSearch(value)}
        placeholder={t('searchMessages')}
        className="-ml-2"
      />

      <ToolbarSpacer />

      <ToolbarButton
        title={t('clearMessages')}
        disabled={!store.selectedConnection}
        onClick={() => store.clearMessages()}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})

export default observer(function MessageList() {
  const { t } = useTranslation()
  const messages = store.filteredMessages

  const rowData = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        direction: m.direction,
        data: m.data,
        timestamp: m.timestamp,
        size: m.size,
        isBinary: m.isBinary,
      })),
    [messages]
  )

  const columnDefs: ColDef<WsMessage>[] = useMemo(
    () => [
      {
        colId: 'direction',
        headerName: '',
        width: 56,
        maxWidth: 72,
        sortable: false,
        resizable: false,
        cellRenderer: DirectionCell,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        },
      },
      {
        field: 'timestamp',
        headerName: t('time'),
        width: 110,
        sortable: true,
        valueFormatter: (params) =>
          params.value ? formatMessageTime(params.value) : '',
        cellClass: `font-mono text-xs ${tw.text.tertiary}`,
      },
      {
        field: 'size',
        headerName: t('size'),
        width: 80,
        sortable: true,
        valueFormatter: (params) =>
          params.value != null ? t('bytes', { count: params.value }) : '',
        cellClass: `text-xs ${tw.text.tertiary}`,
      },
      {
        field: 'data',
        headerName: t('content'),
        flex: 1,
        minWidth: 160,
        sortable: false,
        cellRenderer: ContentCell,
      },
    ],
    [t]
  )

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<WsMessage>) => {
      const rows = event.api.getSelectedRows()
      store.selectMessage(rows[0]?.id || null)
    },
    []
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<WsMessage>) => params.data.id,
    []
  )

  const localeText = useMemo(
    () => ({
      noRowsToShow: store.selectedConnection
        ? t('noMessages')
        : t('selectConnection'),
    }),
    [t, store.selectedConnection]
  )

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <Grid<WsMessage>
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={rowData}
        rowSelection={{
          mode: 'singleRow',
          checkboxes: false,
          enableClickSelection: true,
        }}
        onSelectionChanged={onSelectionChanged}
        getRowId={getRowId}
        animateRows={false}
        enableCellTextSelection={false}
        suppressCellFocus={true}
        localeText={localeText}
      />
    </div>
  )
})
