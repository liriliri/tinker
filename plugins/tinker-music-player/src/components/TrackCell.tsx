import { observer } from 'mobx-react-lite'
import { Music } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

export interface TrackRowData {
  id: string
  index: number
  title: string
  artist: string
  album: string
  duration: number
  cover?: string
  path: string
}

export const TitleCellRenderer = observer(
  (props: { data: TrackRowData | undefined }) => {
    const data = props.data
    if (!data) return null
    const isActive = store.currentTrack?.id === data.id

    return (
      <div className="flex items-center gap-3 h-full">
        {data.cover ? (
          <img
            src={data.cover}
            className="w-7 h-7 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${tw.bg.secondary}`}
          >
            <Music size={12} className={tw.text.tertiary} />
          </div>
        )}
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
