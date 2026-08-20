import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { MenuItemConstructorOptions } from 'electron'
import store from '../store'
import type { Track } from '../types'
import TrackList from './TrackList'

const Playlist = observer(() => {
  const { t } = useTranslation()

  const getContextMenu = useCallback(
    (track: Track): MenuItemConstructorOptions[] => [
      {
        label: t('addToSheet'),
        click: () => store.showAddToSheet(track.id),
      },
      { type: 'separator' },
      {
        label: t('showInFolder'),
        click: () => tinker.showItemInPath(track.path),
      },
      {
        label: t('remove'),
        click: () => store.removeTrack(track.id),
      },
    ],
    [t]
  )

  return (
    <TrackList
      tracks={store.filteredTracks}
      emptyMessage={t('emptyPlaylist')}
      sortable
      onPlay={(track) => store.playTrackById(track.id)}
      getContextMenu={getContextMenu}
    />
  )
})

export default Playlist
