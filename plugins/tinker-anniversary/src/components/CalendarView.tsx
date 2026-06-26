import { useMemo, useRef, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import zhLocale from '@fullcalendar/core/locales/zh-cn'
import type {
  EventClickArg,
  DatesSetArg,
  EventContentArg,
  DayCellContentArg,
} from '@fullcalendar/core'
import { useTranslation } from 'react-i18next'
import { HOLIDAYS_NS } from 'share/lib/holidays'
import AnniversaryDialog, {
  type AnniversaryFormData,
} from './AnniversaryDialog'
import store from '../store'
import { getDatePart, normalizeDateKey } from '../lib/date'
import { getLunarDate } from '../lib/lunar'

interface CalendarViewProps {
  calendarRef: React.RefObject<FullCalendar | null>
}

const CalendarView = observer(({ calendarRef }: CalendarViewProps) => {
  const { i18n, t } = useTranslation()
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastClickInfoRef = useRef<DateClickArg | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
  const calendarPlugins = useMemo(() => [dayGridPlugin, interactionPlugin], [])

  const handleDateClick = (info: DateClickArg) => {
    lastClickInfoRef.current = info

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }

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
    store.openAnniversaryDialog(info.dateStr)
  }

  const handleEventClick = (info: EventClickArg) => {
    if (info.event.classNames.includes('holiday-event')) {
      if (info.event.start) {
        store.setSelectedDate(info.event.start)
      }
      return
    }

    const anniversaryId = info.event.extendedProps.anniversaryId as
      | string
      | undefined
    if (!anniversaryId || !info.event.start) return

    store.setSelectedDate(info.event.start)
    store.openAnniversaryDialog(getDatePart(info.event.startStr), anniversaryId)
  }

  const handleDialogSave = (data: AnniversaryFormData) => {
    if (store.editingAnniversaryId) {
      store.updateAnniversary(store.editingAnniversaryId, data)
    } else {
      store.addAnniversary(data)
    }
  }

  const handleDatesSet = (arg: DatesSetArg) => {
    const endDate = new Date(arg.end)
    endDate.setDate(endDate.getDate() - 1)
    store.setVisibleRange(arg.start, endDate)
  }

  const editingAnniversary = store.editingAnniversaryId
    ? store.getAnniversaryById(store.editingAnniversaryId)
    : null

  const dayCellClassNames = (arg: { date: Date }) => {
    if (normalizeDateKey(arg.date) === store.selectedDate) {
      return ['fc-day-selected']
    }
    return []
  }

  const handleEventContent = (arg: EventContentArg) => {
    if (arg.event.classNames.includes('holiday-event')) {
      return {
        html: `<div class="fc-event-title">${t(arg.event.title, {
          ns: HOLIDAYS_NS,
        })}</div>`,
      }
    }
    return true
  }

  const handleDayCellContent = (arg: DayCellContentArg) => {
    const isZhCN = i18n.language === 'zh-CN'
    const lunarText = isZhCN ? getLunarDate(arg.date) : ''

    return {
      html: `
        <div class="tinker-day-content">
          ${
            lunarText ? `<div class="tinker-lunar-date">${lunarText}</div>` : ''
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
          editable={false}
          navLinks={false}
          moreLinkClick="popover"
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          dayCellClassNames={dayCellClassNames}
          dayCellContent={handleDayCellContent}
          eventContent={handleEventContent}
        />
      </div>
      <AnniversaryDialog
        isOpen={store.dialogOpen}
        onClose={() => store.closeAnniversaryDialog()}
        onSave={handleDialogSave}
        initialDate={store.dialogDate}
        initialTitle={editingAnniversary?.title}
        initialIsLunar={editingAnniversary?.isLunar}
        initialMonth={editingAnniversary?.month}
        initialDay={editingAnniversary?.day}
        initialLunarMonth={editingAnniversary?.lunarMonth}
        initialLunarDay={editingAnniversary?.lunarDay}
        initialStartYear={editingAnniversary?.startYear}
      />
    </>
  )
})

export default CalendarView
