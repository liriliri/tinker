import { observer } from 'mobx-react-lite'
import { useRef } from 'react'
import { HardDrive } from 'lucide-react'
import fileSize from 'licia/fileSize'
import { tw, THEME_COLORS } from 'share/theme'
import type { DiskSpaceMount } from '../../common/types'
import { CARD_LAYOUT } from '../lib/cardLayout'
import { useCardSize } from '../lib/useCardSize'
import store from '../store'
import StatsRing from './StatsRing'

const DISK_COLOR = '#06b6d4'

interface DiskMountCardProps {
  disk: DiskSpaceMount
}

const DiskMountCard = observer(function DiskMountCard({
  disk,
}: DiskMountCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const cardSize = useCardSize(cardRef)
  const layout = CARD_LAYOUT[cardSize]
  const stats = `${disk.use.toFixed(1)}%`
  const detail = `${fileSize(disk.used)} / ${fileSize(disk.size)}`

  return (
    <div
      ref={cardRef}
      style={{ height: layout.height }}
      className={`${tw.bg.tertiary} ${tw.border} border rounded-lg shadow-sm flex items-center justify-center min-w-0 px-1`}
    >
      <StatsRing
        label={disk.mount}
        stats={stats}
        progress={disk.use}
        color={DISK_COLOR}
        trackColor={
          store.isDark ? THEME_COLORS.border.dark : THEME_COLORS.border.light
        }
        Icon={HardDrive}
        detail={detail}
        size={cardSize}
      />
    </div>
  )
})

export default DiskMountCard
