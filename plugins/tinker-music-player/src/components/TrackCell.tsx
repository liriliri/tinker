import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import store from '../store'
import TrackCover from './TrackCover'

export interface TrackRowData {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  cover?: string
  path: string
}

function playTrack(id: string) {
  const realIndex = store.tracks.findIndex((t) => t.id === id)
  if (realIndex >= 0) {
    store.playTrack(realIndex)
  }
}

export const TitleCellRenderer = observer(
  (props: { data: TrackRowData | undefined }) => {
    const data = props.data
    if (!data) return null
    const isActive = store.currentTrack?.id === data.id

    return (
      <div className="flex items-center gap-3 h-full">
        <TrackCover cover={data.cover} onClick={() => playTrack(data.id)} />
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
  }
)
