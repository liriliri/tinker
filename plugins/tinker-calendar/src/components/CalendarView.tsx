import { useMemo, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from '@fullcalendar/interaction'
import zhLocale from '@fullcalendar/core/locales/zh-cn'
import type {
  EventClickArg,
  EventDropArg,
  DatesSetArg,
  EventContentArg,
  DayCellContentArg,
} from '@fullcalendar/core'
import { useTranslation } from 'react-i18next'
import EventDialog, { type EventFormData } from './EventDialog'
import store from '../store'
import { getLunarDate } from '../lib/lunar'

interface CalendarViewProps {
  calendarRef: React.RefObject<FullCalendar | null>
  setCurrentView: (view: string) => void
}

const CalendarView = observer(
  ({ calendarRef, setCurrentView }: CalendarViewProps) => {
    const { i18n, t } = useTranslation()
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
    const lastClickInfoRef = useRef<DateClickArg | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Delay resize to allow sidebar animation to complete before recalculating
    useEffect(() => {
      const timer = setTimeout(() => {
        calendarRef.current?.getApi()?.updateSize()
      }, 100)
      return () => clearTimeout(timer)
    }, [store.sidebarOpen, calendarRef])

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const handleDoubleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const dayCell = target.closest('.fc-daygrid-day')

        if (dayCell && lastClickInfoRef.current) {
          handleDateDoubleClick(lastClickInfoRef.current)
        }
      }

      container.addEventListener('dblclick', handleDoubleClick)
      return () => {
        container.removeEventListener('dblclick', handleDoubleClick)
      }
    }, [])
    const calendarLocale = useMemo(
      () => (i18n.language === 'zh-CN' ? zhLocale : undefined),
      [i18n.language]
    )
    const calendarPlugins = useMemo(
      () => [dayGridPlugin, timeGridPlugin, interactionPlugin],
      []
    )

    const handleDateClick = async (info: DateClickArg) => {
      lastClickInfoRef.current = info

      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }

      // Delay single-click action to allow double-click to cancel it
      clickTimerRef.current = setTimeout(() => {
        store.setSelectedDate(info.dateStr)
        clickTimerRef.current = null
      }, 250)
    }

    const handleDateDoubleClick = (info: DateClickArg) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }

      store.setSelectedDate(info.dateStr)
      store.openEventDialog(info.dateStr)
    }

    const handleEventClick = (info: EventClickArg) => {
      if (info.event.classNames.includes('holiday-event')) {
        return
      }
      const eventDate = info.event.start ?? new Date()
      store.setSelectedDate(eventDate)
      store.openEventDialog(info.event.startStr.slice(0, 10), info.event.id)
    }

    const handleDialogSave = (data: EventFormData) => {
      if (store.editingEventId) {
        store.updateEvent(
          store.editingEventId,
          data.title,
          data.startDate,
          data.isAllDay,
          data.startTime,
          data.endTime,
          data.endDate
        )
      } else {
        store.addEvent(
          data.startDate,
          data.title,
          data.isAllDay,
          data.startTime,
          data.endTime,
          data.endDate
        )
      }
    }

    const handleEventDrop = (info: EventDropArg) => {
      if (!info.event.start) return
      store.updateEventDate(info.event.id, info.event.start)
    }

    const handleEventResize = (info: EventResizeDoneArg) => {
      if (!info.event.start) return
      store.updateEventDate(info.event.id, info.event.start)
    }

    const handleDatesSet = (arg: DatesSetArg) => {
      setCurrentView(arg.view.type)

      if (arg.view.type === 'timeGridDay') {
        const viewDate = arg.view.currentStart
        const year = viewDate.getFullYear()
        const month = String(viewDate.getMonth() + 1).padStart(2, '0')
        const day = String(viewDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        store.setSelectedDate(dateStr)
      }
    }

    const editingEvent = store.editingEventId
      ? store.getEventById(store.editingEventId)
      : null

    const dayCellClassNames = (arg: { date: Date }) => {
      const year = arg.date.getFullYear()
      const month = String(arg.date.getMonth() + 1).padStart(2, '0')
      const day = String(arg.date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      if (dateStr === store.selectedDate) {
        return ['fc-day-selected']
      }
      return []
    }

    const handleEventContent = (arg: EventContentArg) => {
      if (arg.event.classNames.includes('holiday-event')) {
        return {
          html: `<div class="fc-event-title">${t(arg.event.title)}</div>`,
        }
      }
      return true
    }

    const handleDayCellContent = (arg: DayCellContentArg) => {
      const isZhCN = i18n.language === 'zh-CN'
      const isMonthView = arg.view.type === 'dayGridMonth'

      if (!isZhCN || !isMonthView) {
        return { html: arg.dayNumberText }
      }

      const lunarText = getLunarDate(arg.date)

      return {
        html: `
          <div class="tinker-day-content">
            ${
              lunarText
                ? `<div class="tinker-lunar-date">${lunarText}</div>`
                : ''
            }
            <div class="tinker-day-number">${arg.dayNumberText}</div>
          </div>
        `,
      }
    }

    return (
      <>
        <div ref={containerRef} className="h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={calendarPlugins}
            initialView="dayGridMonth"
            headerToolbar={false}
            height="100%"
            expandRows={true}
            fixedWeekCount={false}
            firstDay={0}
            dayMaxEvents={3}
            eventOrder="order,start,title"
            events={store.calendarEvents}
            locale={calendarLocale}
            editable={true}
            navLinks={true}
            navLinkDayClick="timeGridDay"
            moreLinkClick="popover"
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            datesSet={handleDatesSet}
            dayCellClassNames={dayCellClassNames}
            dayCellContent={handleDayCellContent}
            eventContent={handleEventContent}
          />
        </div>
        <EventDialog
          isOpen={store.eventDialogOpen}
          onClose={() => store.closeEventDialog()}
          onSave={handleDialogSave}
          initialDate={store.eventDialogDate}
          initialTitle={editingEvent?.title}
          initialStartTime={editingEvent?.start.slice(11, 16)}
          initialEndTime={editingEvent?.end?.slice(11, 16)}
          initialEndDate={editingEvent?.end?.slice(0, 10)}
        />
      </>
    )
  }
)

export default CalendarView
