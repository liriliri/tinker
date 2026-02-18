import { useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw } from 'share/theme'
import CalendarView from './components/CalendarView'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import store from './store'

export default observer(function App() {
  const { i18n } = useTranslation()
  const calendarRef = useRef<any>(null)
  const [currentView, setCurrentView] = useState<string>('dayGridMonth')

  return (
    <ConfirmProvider locale={i18n.language}>
      <PromptProvider locale={i18n.language}>
        <div
          className={`h-screen flex flex-col transition-colors ${tw.bg.primary} ${tw.text.both.primary}`}
        >
          <Toolbar
            calendarRef={calendarRef}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1">
              <CalendarView
                calendarRef={calendarRef}
                setCurrentView={setCurrentView}
              />
            </div>
            {store.sidebarOpen && (
              <div>
                <Sidebar />
              </div>
            )}
          </div>
        </div>
      </PromptProvider>
    </ConfirmProvider>
  )
})
