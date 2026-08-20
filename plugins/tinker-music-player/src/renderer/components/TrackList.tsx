import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import {
  GetRowIdParams,
  CellDoubleClickedEvent,
  CellContextMenuEvent,
} from 'ag-grid-community'
import type { MenuItemConstructorOptions } from 'electron'
import Grid from 'share/components/Grid'
import store from '../store'
import { useTrackColumns } from '../hooks/useTrackColumns'
import type { Track } from '../types'

interface TrackListProps {
  tracks: Track[]
  emptyMessage: string
  sortable?: boolean
  onPlay: (track: Track) => void
  getContextMenu: (track: Track) => MenuItemConstructorOptions[]
}

const TrackList = observer(function TrackList({
  tracks,
  emptyMessage,
  sortable = false,
  onPlay,
  getContextMenu,
}: TrackListProps) {
  const columnDefs = useTrackColumns(sortable)

  const getRowId = useCallback(
    (params: GetRowIdParams<Track>) => params.data.id,
    []
  )

  const onCellDoubleClicked = useCallback(
    (event: CellDoubleClickedEvent<Track>) => {
      if (event.data) onPlay(event.data)
    },
    [onPlay]
  )

  const handleCellContextMenu = useCallback(
    (event: CellContextMenuEvent<Track>) => {
      if (event.data && event.event) {
        const e = event.event as MouseEvent
        e.preventDefault()
        tinker.showContextMenu(e.clientX, e.clientY, getContextMenu(event.data))
      }
    },
    [getContextMenu]
  )

  return (
    <Grid<Track>
      isDark={store.isDark}
      columnDefs={columnDefs}
      rowData={tracks}
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
      localeText={{ noRowsToShow: emptyMessage }}
    />
  )
})

export default TrackList
