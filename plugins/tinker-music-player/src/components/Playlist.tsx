import { observer } from 'mobx-react-lite'
import { Music } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback } from 'react'
import {
  ColDef,
  GetRowIdParams,
  CellDoubleClickedEvent,
  CellContextMenuEvent,
} from 'ag-grid-community'
import { tw } from 'share/theme'
import Grid from 'share/components/Grid'
import store from '../store'
import { formatTime } from '../lib/util'

interface RowData {
  id: string
  index: number
  title: string
  artist: string
  album: string
  duration: number
  cover?: string
}

const TitleCellRenderer = observer((props: { data: RowData | undefined }) => {
  const data = props.data
  if (!data) return null
  const isActive = store.currentTrack?.id === data.id

  return (
    <div className="flex items-center gap-3 h-full">
      {data.cover ? (
        <img
          src={data.cover}
          className="w-7 h-7 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div
          className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${tw.bg.secondary}`}
        >
          <Music size={12} className={tw.text.tertiary} />
        </div>
      )}
      <div className="min-w-0 flex-1 leading-tight">
        <div
          className={`truncate text-xs ${
            isActive ? tw.primary.text : tw.text.primary
          }`}
        >
          {data.title}
        </div>
        {data.artist && (
          <div className={`text-[11px] ${tw.text.tertiary} truncate mt-px`}>
            {data.artist}
          </div>
        )}
      </div>
    </div>
  )
})

const Playlist = observer(() => {
  const { t } = useTranslation()
  const tracks = store.filteredTracks

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        field: 'index',
        headerName: '#',
        width: 50,
        sortable: false,
        suppressMovable: true,
      },
      {
        field: 'title',
        headerName: t('title'),
        flex: 2,
        minWidth: 200,
        sortable: true,
        cellRenderer: TitleCellRenderer,
      },
      {
        field: 'album',
        headerName: t('album'),
        flex: 1,
        minWidth: 100,
        sortable: true,
      },
      {
        field: 'duration',
        headerName: t('duration'),
        width: 80,
        sortable: true,
        valueFormatter: (params) =>
          params.value > 0 ? formatTime(params.value) : '--:--',
      },
    ],
    [t]
  )

  const rowData: RowData[] = useMemo(
    () =>
      tracks.map((track, index) => ({
        id: track.id,
        index: index + 1,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        cover: track.cover,
      })),
    [tracks]
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.id,
    []
  )

  const onCellDoubleClicked = useCallback(
    (event: CellDoubleClickedEvent<RowData>) => {
      if (event.data) {
        const realIndex = store.tracks.findIndex((t) => t.id === event.data!.id)
        if (realIndex >= 0) {
          store.playTrack(realIndex)
        }
      }
    },
    []
  )

  const handleCellContextMenu = useCallback(
    (event: CellContextMenuEvent<RowData>) => {
      if (event.data && event.event) {
        const e = event.event as MouseEvent
        e.preventDefault()
        tinker.showContextMenu(e.clientX, e.clientY, [
          {
            label: t('remove'),
            click: () => store.removeTrack(event.data!.id),
          },
        ])
      }
    },
    [t]
  )

  const localeText = useMemo(
    () => ({
      noRowsToShow: t('emptyPlaylist'),
    }),
    [t]
  )

  if (tracks.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full ${tw.text.tertiary}`}
      >
        <Music size={48} className="mb-3 opacity-30" />
        <p className="text-sm">{t('emptyPlaylist')}</p>
      </div>
    )
  }

  return (
    <Grid<RowData>
      isDark={store.isDark}
      columnDefs={columnDefs}
      rowData={rowData}
      rowHeight={52}
      defaultColDef={{
        cellStyle: { display: 'flex', alignItems: 'center' },
      }}
      getRowId={getRowId}
      rowSelection={{
        mode: 'singleRow',
        checkboxes: false,
        enableClickSelection: true,
      }}
      onCellDoubleClicked={onCellDoubleClicked}
      onCellContextMenu={handleCellContextMenu}
      suppressCellFocus={true}
      animateRows={true}
      localeText={localeText}
    />
  )
})

export default Playlist
