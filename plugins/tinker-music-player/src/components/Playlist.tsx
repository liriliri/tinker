import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback } from 'react'
import {
  ColDef,
  GetRowIdParams,
  CellDoubleClickedEvent,
  CellContextMenuEvent,
} from 'ag-grid-community'
import Grid from 'share/components/Grid'
import store from '../store'
import { formatTime } from '../lib/util'
import { TitleCellRenderer, TrackRowData } from './TrackCell'

const Playlist = observer(() => {
  const { t } = useTranslation()
  const tracks = store.filteredTracks

  const columnDefs: ColDef<TrackRowData>[] = useMemo(
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

  const rowData: TrackRowData[] = tracks.map((track, index) => ({
    id: track.id,
    index: index + 1,
    title: track.title,
    artist: track.artist,
    album: track.album,
    duration: track.duration,
    cover: track.cover,
    path: track.path,
  }))

  const getRowId = useCallback(
    (params: GetRowIdParams<TrackRowData>) => params.data.id,
    []
  )

  const onCellDoubleClicked = useCallback(
    (event: CellDoubleClickedEvent<TrackRowData>) => {
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
    (event: CellContextMenuEvent<TrackRowData>) => {
      if (event.data && event.event) {
        const e = event.event as MouseEvent
        e.preventDefault()
        const trackId = event.data!.id

        tinker.showContextMenu(e.clientX, e.clientY, [
          {
            label: t('addToSheet'),
            click: () => store.showAddToSheet(trackId),
          },
          { type: 'separator' as const },
          {
            label: t('showInFolder'),
            click: () => tinker.showItemInPath(event.data!.path),
          },
          {
            label: t('remove'),
            click: () => store.removeTrack(trackId),
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

  return (
    <Grid<TrackRowData>
      isDark={store.isDark}
      columnDefs={columnDefs}
      rowData={rowData}
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
