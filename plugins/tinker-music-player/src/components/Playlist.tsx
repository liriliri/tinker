import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback } from 'react'
import {
  GetRowIdParams,
  CellDoubleClickedEvent,
  CellContextMenuEvent,
} from 'ag-grid-community'
import Grid from 'share/components/Grid'
import store from '../store'
import { TrackRowData } from './TrackCell'
import { useTrackColumns } from './useTrackColumns'

const Playlist = observer(() => {
  const { t } = useTranslation()
  const tracks = store.filteredTracks
  const columnDefs = useTrackColumns(true)

  const rowData: TrackRowData[] = tracks.map((track) => ({
    id: track.id,
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
