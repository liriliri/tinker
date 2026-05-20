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

const SheetPlaylist = observer(() => {
  const { t } = useTranslation()
  const tracks = store.filteredSheetTracks

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
        sortable: false,
        cellRenderer: TitleCellRenderer,
      },
      {
        field: 'album',
        headerName: t('album'),
        flex: 1,
        minWidth: 100,
        sortable: false,
      },
      {
        field: 'duration',
        headerName: t('duration'),
        width: 80,
        sortable: false,
        valueFormatter: (params) =>
          params.value > 0 ? formatTime(params.value) : '--:--',
      },
    ],
    [t]
  )

  const rowData: TrackRowData[] = useMemo(
    () =>
      tracks.map((track, index) => ({
        id: track.id,
        index: index + 1,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        cover: track.cover,
        path: track.path,
      })),
    [tracks]
  )

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
        tinker.showContextMenu(e.clientX, e.clientY, [
          {
            label: t('removeFromSheet'),
            click: () =>
              store.removeTrackFromSheet(event.data!.id, store.activeSheetId),
          },
          { type: 'separator' as const },
          {
            label: t('showInFolder'),
            click: () => tinker.showItemInPath(event.data!.path),
          },
        ])
      }
    },
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
      localeText={{ noRowsToShow: t('emptySheet') }}
    />
  )
})

export default SheetPlaylist
