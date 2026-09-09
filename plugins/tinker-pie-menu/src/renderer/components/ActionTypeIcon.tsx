import { Folder, Globe, Monitor, Package, Terminal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ActionType } from '../types'

export const ACTION_TYPE_ICONS: Record<ActionType, LucideIcon> = {
  command: Terminal,
  app: Monitor,
  directory: Folder,
  url: Globe,
  plugin: Package,
}

interface ActionTypeIconProps {
  type: ActionType
  size?: number
  className?: string
}

export default function ActionTypeIcon({
  type,
  size = 14,
  className,
}: ActionTypeIconProps) {
  const Icon = ACTION_TYPE_ICONS[type]
  return <Icon size={size} className={className} />
}
