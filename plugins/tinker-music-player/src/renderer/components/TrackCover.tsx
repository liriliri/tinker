import { Music, Play } from 'lucide-react'
import { tw } from 'share/theme'

interface TrackCoverProps {
  cover?: string
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export default function TrackCover({
  cover,
  className = 'w-7 h-7',
  onClick,
}: TrackCoverProps) {
  return (
    <div
      className={`relative ${className} flex-shrink-0 group/cover`}
      onClick={onClick}
    >
      {cover ? (
        <img src={cover} className={`${className} rounded object-cover`} />
      ) : (
        <div
          className={`${className} rounded flex items-center justify-center ${tw.bg.secondary}`}
        >
          <Music
            size={12}
            className={`${tw.text.tertiary} group-hover/cover:opacity-0 transition-opacity`}
          />
        </div>
      )}
      <div className="absolute inset-0 rounded bg-black/50 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
        <Play size={12} fill="white" className="text-white" />
      </div>
    </div>
  )
}
