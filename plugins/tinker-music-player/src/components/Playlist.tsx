import { observer } from 'mobx-react-lite'
import { Music, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { formatTime } from '../lib/util'

const Playlist = observer(() => {
  const { t } = useTranslation()
  const tracks = store.filteredTracks

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('remove'),
        click: () => store.removeTrack(trackId),
      },
    ])
  }

  if (tracks.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full ${tw.text.tertiary}`}
      >
        <Music size={48} className="mb-3 opacity-40" />
        <p className="text-sm">{t('emptyPlaylist')}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <table className="w-full text-sm">
        <thead className={`sticky top-0 ${tw.bg.primary}`}>
          <tr className={`border-b ${tw.border}`}>
            <th
              className={`text-left px-3 py-2 w-10 ${tw.text.tertiary} font-normal`}
            >
              #
            </th>
            <th
              className={`text-left px-3 py-2 ${tw.text.tertiary} font-normal`}
            >
              {t('title')}
            </th>
            <th
              className={`text-right px-3 py-2 w-20 ${tw.text.tertiary} font-normal`}
            >
              {t('duration')}
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => {
            const isActive = store.currentTrack?.id === track.id
            return (
              <tr
                key={track.id}
                className={`border-b ${tw.border} cursor-pointer ${
                  isActive ? tw.bg.select : `${tw.hover}`
                }`}
                onDoubleClick={() => {
                  const realIndex = store.tracks.indexOf(track)
                  store.playTrack(realIndex)
                }}
                onContextMenu={(e) => handleContextMenu(e, track.id)}
              >
                <td
                  className={`px-3 py-2 ${
                    isActive ? tw.primary.text : tw.text.tertiary
                  }`}
                >
                  {index + 1}
                </td>
                <td
                  className={`px-3 py-2 ${
                    isActive ? tw.primary.text : tw.text.primary
                  }`}
                >
                  <div className="truncate">{track.title}</div>
                  <div className={`text-xs ${tw.text.tertiary} truncate`}>
                    {track.artist}
                  </div>
                </td>
                <td className={`text-right px-3 py-2 ${tw.text.tertiary}`}>
                  {track.duration > 0 ? formatTime(track.duration) : '--:--'}
                </td>
                <td className="px-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      store.removeTrack(track.id)
                    }}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:${tw.bg.secondary} ${tw.text.tertiary}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export default Playlist
