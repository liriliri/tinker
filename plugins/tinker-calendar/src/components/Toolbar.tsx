import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { prompt } from 'share/components/Prompt'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import type { CalendarApi } from '@fullcalendar/core'
import store from '../store'

interface ToolbarComponentProps {
  calendarRef: React.RefObject<{ getApi: () => CalendarApi }>
}

function getDateLabel(dateKey: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(`${dateKey}T00:00:00`))
}

export default observer(function ToolbarComponent({
  calendarRef,
}: ToolbarComponentProps) {
  const { t, i18n } = useTranslation()
  const titleRef = useRef<HTMLDivElement>(null)
  const [currentView, setCurrentView] = useState<string>('dayGridMonth')

  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const getCalendarApi = () => calendarRef.current?.getApi()

  useEffect(() => {
    const timer = setTimeout(() => {
      updateTitle(getCalendarApi())
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handlePrev = () => {
    const api = getCalendarApi()
    api?.prev()
    updateTitle(api)
  }

  const handleNext = () => {
    const api = getCalendarApi()
    api?.next()
    updateTitle(api)
  }

  const handleToday = () => {
    const api = getCalendarApi()
    api?.today()
    updateTitle(api)
  }

  const handleViewChange = (view: string) => {
    const api = getCalendarApi()
    api?.changeView(view)
    setCurrentView(view)
    updateTitle(api)
  }

  const updateTitle = (api?: CalendarApi) => {
    if (!api || !titleRef.current) return
    titleRef.current.textContent = api.view.title
  }

  const handleAddEvent = async () => {
    const selectedDateLabel = getDateLabel(store.selectedDate, dateFormatter)
    const title = await prompt({
      title: t('newEventTitle'),
      message: t('newEventMessage', { date: selectedDateLabel }),
      placeholder: t('eventTitlePlaceholder'),
    })

    if (!title) return
    store.addEvent(store.selectedDate, title)
  }

  return (
    <Toolbar className="!border-b-0">
      <ToolbarButton onClick={handleAddEvent} title={t('addEvent')}>
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />
      <ToolbarButton onClick={handlePrev} title={t('previous')}>
        <ChevronLeft size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={handleNext} title={t('next')}>
        <ChevronRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <div ref={titleRef} className="text-xs font-semibold px-2 leading-none" />

      <ToolbarSpacer />

      <ToolbarButton
        onClick={handleToday}
        title={t('today')}
        className="text-xs leading-none"
      >
        {t('today')}
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        variant="toggle"
        active={currentView === 'timeGridDay'}
        onClick={() => handleViewChange('timeGridDay')}
        title={t('dayView')}
        className="text-xs leading-none"
      >
        {t('day')}
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={currentView === 'timeGridWeek'}
        onClick={() => handleViewChange('timeGridWeek')}
        title={t('weekView')}
        className="text-xs leading-none"
      >
        {t('week')}
      </ToolbarButton>

      <ToolbarButton
        variant="toggle"
        active={currentView === 'dayGridMonth'}
        onClick={() => handleViewChange('dayGridMonth')}
        title={t('monthView')}
        className="text-xs leading-none"
      >
        {t('month')}
      </ToolbarButton>
    </Toolbar>
  )
})
