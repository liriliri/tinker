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
import { prompt } from 'share/components/Prompt'
import store from '../store'

interface CalendarViewProps {
  calendarRef: React.RefObject<any>
  setCurrentView: (view: string) => void
}

function getDateLabel(dateKey: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(`${dateKey}T00:00:00`))
}

const CalendarView = observer(
  ({ calendarRef, setCurrentView }: CalendarViewProps) => {
    const { t, i18n } = useTranslation()
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

      const handleDoubleClick = async (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const dayCell = target.closest('.fc-daygrid-day')

        if (dayCell && lastClickInfoRef.current) {
          await handleDateDoubleClick(lastClickInfoRef.current)
        }
      }

      calendarEl.addEventListener('dblclick', handleDoubleClick)
      return () => {
        calendarEl.removeEventListener('dblclick', handleDoubleClick)
      }
    }, [i18n.language])
    const calendarLocale = useMemo(
      () => (i18n.language === 'zh-CN' ? zhLocale : undefined),
      [i18n.language]
    )
    const dateFormatter = useMemo(
      () =>
        new Intl.DateTimeFormat(i18n.language, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
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

    const handleDateDoubleClick = async (info: DateClickArg) => {
      // Clear single click timer
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
      }

      store.setSelectedDate(info.dateStr)
      const title = await prompt({
        title: t('newEventTitle'),
        message: t('newEventMessage', {
          date: getDateLabel(info.dateStr, dateFormatter),
        }),
        placeholder: t('eventTitlePlaceholder'),
      })

      if (!title) return
      store.addEvent(info.dateStr, title)
    }

    const handleEventClick = async (info: EventClickArg) => {
      const eventDate = info.event.start ?? new Date()
      store.setSelectedDate(eventDate)
      const nextTitle = await prompt({
        title: t('editEventTitle'),
        defaultValue: info.event.title,
        placeholder: t('eventTitlePlaceholder'),
      })

      if (!nextTitle) return
      store.updateEventTitle(info.event.id, nextTitle)
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

    return (
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
        events={store.events}
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
    )
  }
)

export default CalendarView
