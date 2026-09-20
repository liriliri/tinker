import { useRef } from 'react'
import { observer } from 'mobx-react-lite'
import FullCalendar from '@fullcalendar/react'
import { ConfirmProvider } from 'share/components/Confirm'
import { tw } from 'share/theme'
import CalendarView from './components/CalendarView'
import HabitDialog from './components/HabitDialog'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const calendarRef = useRef<FullCalendar | null>(null)
  const editing = store.editingHabit

  return (
    <ConfirmProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.primary} ${tw.text.primary}`}
      >
        <Toolbar calendarRef={calendarRef} />
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 min-w-0">
            <CalendarView calendarRef={calendarRef} />
          </div>
          {store.sidebarOpen && (
            <div className="min-h-0 h-full">
              <Sidebar />
            </div>
          )}
        </div>
        <HabitDialog
          isOpen={store.dialogOpen}
          onClose={() => store.closeHabitDialog()}
          habit={editing}
          onSave={(data) => {
            if (editing) {
              store.updateHabit(editing.id, data)
            } else {
              store.addHabit(data)
            }
            store.closeHabitDialog()
          }}
        />
      </div>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
