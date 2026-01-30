import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from '@fullcalendar/interaction'
import zhLocale from '@fullcalendar/core/locales/zh-cn'
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
import { useTranslation } from 'react-i18next'
import { prompt } from 'share/components/Prompt'
import store from '../store'

interface CalendarViewProps {
  calendarRef: React.RefObject<any>
}

function getDateLabel(dateKey: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(`${dateKey}T00:00:00`))
}

const CalendarView = observer(({ calendarRef }: CalendarViewProps) => {
  const { t, i18n } = useTranslation()
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
    store.setSelectedDate(info.date)
    const title = await prompt({
      title: t('newEventTitle'),
      message: t('newEventMessage', {
        date: getDateLabel(info.dateStr, dateFormatter),
      }),
      placeholder: t('eventTitlePlaceholder'),
    })

    if (!title) return
    store.addEvent(info.date, title)
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

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={calendarPlugins}
      initialView="dayGridMonth"
      headerToolbar={false}
      height="100%"
      expandRows={true}
      fixedWeekCount={false}
      dayMaxEvents={3}
      events={store.events}
      locale={calendarLocale}
      editable={true}
      navLinks={true}
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
    />
  )
})

export default CalendarView
