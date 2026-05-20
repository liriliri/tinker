import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColDef } from 'ag-grid-community'
import { mediaDurationFormat } from 'share/lib/util'
import { TitleCellRenderer, TrackRowData } from './TrackCell'

export function useTrackColumns(sortable = false): ColDef<TrackRowData>[] {
  const { t } = useTranslation()

  return useMemo(
    () => [
      {
        field: 'title',
        headerName: t('title'),
        flex: 2,
        minWidth: 200,
        sortable,
        cellRenderer: TitleCellRenderer,
      },
      {
        field: 'album',
        headerName: t('album'),
        flex: 1,
        minWidth: 100,
        sortable,
      },
      {
        field: 'duration',
        headerName: t('duration'),
        width: 80,
        sortable,
        valueFormatter: (params) =>
          params.value > 0 ? mediaDurationFormat(params.value) : '--:--',
      },
    ],
    [t, sortable]
  )
}
