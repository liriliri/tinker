import { ComponentType, ReactNode } from 'react'
import type { MenuItemConstructorOptions } from 'electron'
import { tw } from '../theme'
import className from 'licia/className'

export interface NavListItem {
  id: string
  icon?: ComponentType<{ size?: number; className?: string }>
  iconClassName?: string
  label: ReactNode
  count?: number
  suffix?: ReactNode
  title?: string
  menu?: () => MenuItemConstructorOptions[]
}

interface NavListProps {
  items: NavListItem[]
  activeId?: string
  onSelect?: (id: string) => void
  iconSize?: number
  className?: string
}

export default function NavList({
  items,
  activeId,
  onSelect,
  iconSize = 14,
  className: customClassName,
}: NavListProps) {
  return (
    <div className={customClassName}>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeId === item.id

        const handleContextMenu = (e: React.MouseEvent) => {
          if (!item.menu) return
          e.preventDefault()
          tinker.showContextMenu(e.clientX, e.clientY, item.menu())
        }

        return (
          <button
            key={item.id}
            title={item.title}
            className={className(
              'w-full flex items-center gap-2 py-2.5 px-2 transition-colors text-sm',
              tw.hover,
              tw.text.primary,
              isActive && tw.active
            )}
            onClick={() => onSelect?.(item.id)}
            onContextMenu={handleContextMenu}
          >
            {Icon && <Icon size={iconSize} className={item.iconClassName} />}
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.suffix !== undefined
              ? item.suffix
              : item.count !== undefined && (
                  <span className={`text-xs tabular-nums ${tw.text.secondary}`}>
                    {item.count}
                  </span>
                )}
          </button>
        )
      })}
    </div>
  )
}
