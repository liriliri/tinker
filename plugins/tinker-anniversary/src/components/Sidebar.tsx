import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import type { MenuItemConstructorOptions } from 'electron'
import className from 'licia/className'
import { Heart } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import { HOLIDAYS_NS } from 'share/lib/holidays'
import { formatAnniversaryDateLabel } from '../lib/anniversary'
import { normalizeDateKey } from '../lib/date'
import store from '../store'
import type { Anniversary, SidebarItem } from '../types'

function formatDateLabel(
  item: SidebarItem,
  anniversary: Anniversary | undefined,
  monthFormatter: Intl.DateTimeFormat,
  yearFormatter: Intl.DateTimeFormat,
  formatStartYearLunar: (year: number, lunarLabel: string) => string
): string {
  if (item.isHoliday) {
    return monthFormatter.format(new Date(`${item.nextDate}T00:00:00`))
  }

  if (!anniversary) {
    return monthFormatter.format(new Date(`${item.nextDate}T00:00:00`))
  }

  return formatAnniversaryDateLabel(
    anniversary,
    item.nextDate,
    monthFormatter,
    yearFormatter,
    formatStartYearLunar
  )
}

interface SidebarListItemProps {
  item: SidebarItem
  anniversary?: Anniversary
  isSelected: boolean
  monthFormatter: Intl.DateTimeFormat
  yearFormatter: Intl.DateTimeFormat
  formatStartYearLunar: (year: number, lunarLabel: string) => string
  onClick: () => void
  onDoubleClick: () => void
  onContextMenu: (event: React.MouseEvent) => void
}

function SidebarListItem({
  item,
  anniversary,
  isSelected,
  monthFormatter,
  yearFormatter,
  formatStartYearLunar,
  onClick,
  onDoubleClick,
  onContextMenu,
}: SidebarListItemProps) {
  const { t } = useTranslation()
  const isToday = item.daysUntil === 0
  const title = item.isHoliday ? t(item.title, { ns: HOLIDAYS_NS }) : item.title
  const dateLabel = formatDateLabel(
    item,
    anniversary,
    monthFormatter,
    yearFormatter,
    formatStartYearLunar
  )

  return (
    <div
      className={className(
        'flex items-stretch gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-all',
        tw.border,
        tw.bg.primary,
        isSelected
          ? `${tw.primary.bgFocused} ${tw.primary.border} shadow-sm`
          : tw.hover
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${tw.text.primary}`}>
          {title}
        </div>
        <div className={`text-[10px] mt-0.5 truncate ${tw.text.secondary}`}>
          {dateLabel}
        </div>
        {item.daysSince !== undefined && (
          <div className={`text-[10px] mt-0.5 truncate ${tw.text.tertiary}`}>
            {t('daysSince', { count: item.daysSince })}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-w-[2.25rem] shrink-0 self-center">
        {isToday ? (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tw.primary.bgFocused} ${tw.primary.text}`}
          >
            {t('today')}
          </span>
        ) : (
          <>
            <span
              className={`text-lg font-semibold tabular-nums leading-none ${
                item.isHoliday ? 'text-orange-500' : tw.primary.text
              }`}
            >
              {item.daysUntil}
            </span>
            <span
              className={`text-[10px] leading-tight ${
                item.isHoliday ? tw.text.tertiary : tw.primary.text
              }`}
            >
              {t('daysUnit')}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

const Sidebar = observer(() => {
  const { t, i18n } = useTranslation()
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: 'long',
        day: 'numeric',
      }),
    [i18n.language]
  )
  const yearFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [i18n.language]
  )

  const sidebarItems = store.sidebarItems
  const selectedDate = store.selectedDate

  const handleEdit = (item: SidebarItem) => {
    if (!item.anniversaryId) return
    store.openAnniversaryDialog(item.nextDate, item.anniversaryId)
  }

  const handleDelete = async (item: SidebarItem) => {
    if (!item.anniversaryId) return

    const shouldDelete = await confirm({
      title: t('deleteAnniversaryTitle'),
      message: t('deleteAnniversaryMessage', { title: item.title }),
    })

    if (!shouldDelete) return
    store.removeAnniversary(item.anniversaryId)
  }

  const handleItemClick = (item: SidebarItem) => {
    store.setSelectedDate(item.nextDate)
  }

  const handleItemDoubleClick = (item: SidebarItem) => {
    if (item.isHoliday || !item.anniversaryId) return
    handleEdit(item)
  }

  const handleContextMenu = (event: React.MouseEvent, item: SidebarItem) => {
    if (item.isHoliday || !item.anniversaryId) return

    event.preventDefault()
    const menuItems: MenuItemConstructorOptions[] = [
      {
        label: t('editAnniversary'),
        click: () => handleEdit(item),
      },
      {
        label: t('deleteAnniversary'),
        click: () => {
          void handleDelete(item)
        },
      },
    ]
    tinker.showContextMenu(event.clientX, event.clientY, menuItems)
  }

  const formatStartYearLunar = (year: number, lunarLabel: string) =>
    t('startYearLunarDate', { year, date: lunarLabel })

  return (
    <aside
      className={`w-64 h-full flex flex-col min-h-0 border-t ${tw.border} ${tw.bg.tertiary}`}
    >
      <OverlayScrollbars defer className="min-h-0 flex-1">
        {sidebarItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 gap-2">
            <Heart size={28} className={tw.text.tertiary} strokeWidth={1.5} />
            <p className={`text-xs text-center ${tw.text.secondary}`}>
              {t('empty')}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {sidebarItems.map((item) => (
              <SidebarListItem
                key={item.id}
                item={item}
                anniversary={
                  item.anniversaryId
                    ? store.getAnniversaryById(item.anniversaryId)
                    : undefined
                }
                isSelected={normalizeDateKey(item.nextDate) === selectedDate}
                monthFormatter={monthFormatter}
                yearFormatter={yearFormatter}
                formatStartYearLunar={formatStartYearLunar}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                onContextMenu={(event) => handleContextMenu(event, item)}
              />
            ))}
          </div>
        )}
      </OverlayScrollbars>
    </aside>
  )
})

export default Sidebar
