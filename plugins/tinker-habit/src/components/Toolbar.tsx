import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import {
  ChevronLeft,
  ChevronRight,
  PanelRight,
  PanelRightClose,
  Plus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import type { CalendarApi } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import store from '../store'

interface ToolbarComponentProps {
  calendarRef: React.RefObject<FullCalendar | null>
}

export default observer(function ToolbarComponent({
  calendarRef,
}: ToolbarComponentProps) {
  const { t } = useTranslation()
  const titleRef = useRef<HTMLDivElement>(null)

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
    store.setToday()
  }

  const updateTitle = (api?: CalendarApi) => {
    if (!api || !titleRef.current) return
    titleRef.current.textContent = api.view.title
  }

  return (
    <Toolbar className="!border-b-0">
      <ToolbarButton
        onClick={() => store.openHabitDialog()}
        title={t('addHabit')}
      >
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
        onClick={() => store.toggleSidebar()}
        title={t(store.sidebarOpen ? 'hideSidebar' : 'showSidebar')}
      >
        {store.sidebarOpen ? (
          <PanelRightClose size={TOOLBAR_ICON_SIZE} />
        ) : (
          <PanelRight size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>
    </Toolbar>
  )
})
