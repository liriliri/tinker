import { tw } from 'share/theme'

interface CellIndexBadgeProps {
  index: number
}

export default function CellIndexBadge({ index }: CellIndexBadgeProps) {
  return (
    <span
      className={`absolute left-0.5 top-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[11px] leading-none rounded-full ${tw.primary.bg} text-white pointer-events-none`}
    >
      {index}
    </span>
  )
}
