import { useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import zhLocale from '@fullcalendar/core/locales/zh-cn'
import type { DayCellContentArg, EventClickArg } from '@fullcalendar/core'
import { useTranslation } from 'react-i18next'
import { normalizeDateKey } from '../lib/date'
import store from '../store'

interface CalendarViewProps {
  calendarRef: React.RefObject<FullCalendar | null>
}

const SELECTED_DAY_CLASS = ['fc-day-selected']
const EMPTY_DAY_CLASS: string[] = []

const CalendarView = observer(({ calendarRef }: CalendarViewProps) => {
  const { i18n } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(() => {
      calendarRef.current?.getApi()?.updateSize()
    }, 100)
    return () => clearTimeout(timer)
  }, [store.sidebarOpen, calendarRef])

  const calendarLocale = useMemo(
    () => (i18n.language === 'zh-CN' ? zhLocale : undefined),
    [i18n.language]
  )
  const calendarPlugins = useMemo(() => [dayGridPlugin, interactionPlugin], [])

  const handleDateClick = (info: DateClickArg) => {
    store.setSelectedDate(info.dateStr)
  }

  const handleEventClick = (info: EventClickArg) => {
    if (info.event.start) {
      store.setSelectedDate(info.event.start)
    }
  }

  const dayCellClassNames = (arg: { date: Date }) => {
    return normalizeDateKey(arg.date) === store.selectedDate
      ? SELECTED_DAY_CLASS
      : EMPTY_DAY_CLASS
  }

  const handleDayCellContent = (arg: DayCellContentArg) => {
    return {
      html: `
        <div class="tinker-day-content">
          <div class="tinker-day-number">${arg.dayNumberText}</div>
        </div>
      `,
    }
  }

  return (
    <div className="h-full">
      <FullCalendar
        ref={calendarRef}
        plugins={calendarPlugins}
        initialView="dayGridMonth"
        headerToolbar={false}
        height="100%"
        expandRows={true}
        fixedWeekCount={false}
        firstDay={1}
        dayMaxEvents={4}
        events={store.calendarEvents}
        locale={calendarLocale}
        editable={false}
        navLinks={false}
        moreLinkClick="popover"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        dayCellClassNames={dayCellClassNames}
        dayCellContent={handleDayCellContent}
      />
    </div>
  )
})

export default CalendarView
