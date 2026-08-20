import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { MenuItemConstructorOptions } from 'electron'
import store from '../store'
import type { Track } from '../types'
import TrackList from './TrackList'

const SheetPlaylist = observer(() => {
  const { t } = useTranslation()

  const getContextMenu = useCallback(
    (track: Track): MenuItemConstructorOptions[] => [
      {
        label: t('removeFromSheet'),
        click: () => store.removeTrackFromSheet(track.id, store.activeSheetId),
      },
      { type: 'separator' },
      {
        label: t('showInFolder'),
        click: () => tinker.showItemInPath(track.path),
      },
    ],
    [t]
  )

  return (
    <TrackList
      tracks={store.filteredSheetTracks}
      emptyMessage={t('emptySheet')}
      onPlay={(track) => store.playTrackById(track.id)}
      getContextMenu={getContextMenu}
    />
  )
})

export default SheetPlaylist
