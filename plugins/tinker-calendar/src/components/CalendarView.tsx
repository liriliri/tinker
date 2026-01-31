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
} from '@fullcalendar/core'
import { useTranslation } from 'react-i18next'
import EventDialog, { type EventFormData } from './EventDialog'
import store from '../store'

interface CalendarViewProps {
  calendarRef: React.RefObject<any>
  setCurrentView: (view: string) => void
}

const CalendarView = observer(
  ({ calendarRef, setCurrentView }: CalendarViewProps) => {
    const { i18n } = useTranslation()
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
    const lastClickInfoRef = useRef<DateClickArg | null>(null)

    // Watch for sidebar state changes and update calendar size
    useEffect(() => {
      const timer = setTimeout(() => {
        calendarRef.current?.getApi()?.updateSize()
      }, 100)
      return () => clearTimeout(timer)
    }, [store.sidebarOpen, calendarRef])

    useEffect(() => {
      const calendarEl = calendarRef.current?.getApi().el
      if (!calendarEl) return

      const handleDoubleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const dayCell = target.closest('.fc-daygrid-day')

        if (dayCell && lastClickInfoRef.current) {
          handleDateDoubleClick(lastClickInfoRef.current)
        }
      }

      calendarEl.addEventListener('dblclick', handleDoubleClick)
      return () => {
        calendarEl.removeEventListener('dblclick', handleDoubleClick)
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
      // Save click info for potential double click
      lastClickInfoRef.current = info

      // Clear existing timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }

      // Set timer for single click (select date only)
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
    }

    const editingEvent = store.editingEventId
      ? store.getEventById(store.editingEventId)
      : null

    const getEndDate = (event: typeof editingEvent) => {
      if (!event?.end) return undefined
      return event.end.slice(0, 10)
    }

    return (
      <>
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
          events={store.calendarEvents}
          locale={calendarLocale}
          editable={true}
          navLinks={true}
          navLinkDayClick="timeGridDay"
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          datesSet={handleDatesSet}
        />
        <EventDialog
          isOpen={store.eventDialogOpen}
          onClose={() => store.closeEventDialog()}
          onSave={handleDialogSave}
          initialDate={store.eventDialogDate}
          initialTitle={editingEvent?.title}
          initialStartTime={editingEvent?.startTime}
          initialEndTime={editingEvent?.endTime}
          initialEndDate={getEndDate(editingEvent)}
        />
      </>
    )
  }
)

export default CalendarView
