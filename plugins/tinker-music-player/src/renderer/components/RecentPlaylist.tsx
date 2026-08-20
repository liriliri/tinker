import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { MenuItemConstructorOptions } from 'electron'
import store from '../store'
import type { Track } from '../types'
import TrackList from './TrackList'

const RecentPlaylist = observer(() => {
  const { t } = useTranslation()

  const getContextMenu = useCallback(
    (track: Track): MenuItemConstructorOptions[] => [
      {
        label: t('showInFolder'),
        click: () => tinker.showItemInPath(track.path),
      },
    ],
    [t]
  )

  return (
    <TrackList
      tracks={store.filteredRecentTracks}
      emptyMessage={t('emptyRecent')}
      onPlay={(track) => store.playTrackByPath(track.path)}
      getContextMenu={getContextMenu}
    />
  )
})

export default RecentPlaylist
