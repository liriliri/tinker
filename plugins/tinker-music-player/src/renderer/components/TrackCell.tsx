import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import store from '../store'
import TrackCover from './TrackCover'
import type { Track } from '../types'

interface TitleCellRendererProps {
  data: Track | undefined
}

export const TitleCellRenderer = observer(
  ({ data }: TitleCellRendererProps) => {
    if (!data) return null
    const isActive = store.currentTrack?.id === data.id

    return (
      <div className="flex items-center gap-3 h-full">
        <TrackCover
          cover={data.cover}
          onClick={() => store.playTrackById(data.id)}
        />
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
