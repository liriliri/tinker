import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import { prompt } from 'share/components/Prompt'
import { tw } from 'share/theme'
import store, { type CalendarEvent } from '../store'

function formatDateLabel(dateKey: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(`${dateKey}T00:00:00`))
}

const Sidebar = observer(() => {
  const { t, i18n } = useTranslation()
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [i18n.language]
  )

  const selectedDateLabel = formatDateLabel(store.selectedDate, dateFormatter)
  const eventsForSelectedDate = store.eventsForSelectedDate

  const handleEditEvent = async (event: CalendarEvent) => {
    const nextTitle = await prompt({
      title: t('editEventTitle'),
      defaultValue: event.title,
      placeholder: t('eventTitlePlaceholder'),
    })

    if (!nextTitle) return
    store.updateEventTitle(event.id, nextTitle)
  }

  const handleDeleteEvent = async (event: CalendarEvent) => {
    const shouldDelete = await confirm({
      title: t('deleteEventTitle'),
      message: t('deleteEventMessage', { title: event.title }),
    })

    if (!shouldDelete) return
    store.removeEvent(event.id)
  }

  const handleClearAll = async () => {
    if (eventsForSelectedDate.length === 0) return
    const shouldClear = await confirm({
      title: t('clearDayTitle'),
      message: t('clearDayMessage', { date: selectedDateLabel }),
    })

    if (!shouldClear) return
    store.clearEventsForDate(store.selectedDate)
  }

  return (
    <aside
      className={`w-64 h-full flex flex-col border-t ${tw.border.both} ${tw.bg.both.tertiary}`}
    >
      <div className={`p-3 border-b ${tw.border.both}`}>
        <h2 className="text-lg font-semibold">{selectedDateLabel}</h2>
      </div>

      <div className="px-3 pt-3 flex-1 overflow-y-auto">
        {eventsForSelectedDate.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className={`text-sm ${tw.text.both.secondary}`}>{t('empty')}</p>
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {eventsForSelectedDate.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg p-2 transition-all duration-200 hover:shadow-sm ${tw.bg.both.tertiary} ${tw.border.both}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-medium ${tw.text.both.primary}`}
                    >
                      {event.title}
                    </h3>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-0.5">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className={`p-1.5 ${tw.text.both.secondary} ${tw.hover.both} rounded-md transition-colors`}
                      title={t('editEvent')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event)}
                      className={`p-1.5 ${tw.text.both.secondary} ${tw.hover.both} rounded-md transition-colors`}
                      title={t('deleteEvent')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`p-3 border-t ${tw.border.both}`}>
        <button
          className={`w-full px-3 py-1.5 text-xs ${tw.text.both.secondary} ${tw.hover.both} rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleClearAll}
          disabled={eventsForSelectedDate.length === 0}
        >
          {t('clearDay')}
        </button>
      </div>
    </aside>
  )
})

export default Sidebar
