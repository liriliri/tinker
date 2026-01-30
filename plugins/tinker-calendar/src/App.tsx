import { useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw } from 'share/theme'
import CalendarView from './components/CalendarView'
import EventSidebar from './components/EventSidebar'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  const { i18n } = useTranslation()
  const calendarRef = useRef<any>(null)

  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <PromptProvider locale={i18n.language}>
          <div
            className={`h-screen flex flex-col transition-colors ${tw.bg.both.secondary} ${tw.text.both.primary}`}
          >
            <Toolbar calendarRef={calendarRef} />
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1">
                <CalendarView calendarRef={calendarRef} />
              </div>
              <div>
                <EventSidebar />
              </div>
            </div>
          </div>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
