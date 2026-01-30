import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { confirm } from 'share/components/Confirm'
import { prompt } from 'share/components/Prompt'
import { tw } from 'share/theme'
import store, { type CalendarEvent } from '../store'

function formatDateLabel(dateKey: string, formatter: Intl.DateTimeFormat) {
  return formatter.format(new Date(`${dateKey}T00:00:00`))
}

const EventSidebar = observer(() => {
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
    if (!store.hasEvents) return
    const shouldClear = await confirm({
      title: t('clearAllTitle'),
      message: t('clearAllMessage'),
    })

    if (!shouldClear) return
    store.clearEvents()
  }

  return (
    <aside
      className={`w-64 h-full p-6 flex flex-col border-t ${tw.border.both}`}
    >
      <div>
        <h2 className="text-lg font-semibold">{selectedDateLabel}</h2>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto">
        {eventsForSelectedDate.length === 0 ? (
          <p className={`text-sm ${tw.text.both.secondary}`}>
            {t('emptyEvents')}
          </p>
        ) : (
          <div className="space-y-3">
            {eventsForSelectedDate.map((event) => (
              <div
                key={event.id}
                className={`rounded-md border ${tw.border.both} ${tw.bg.both.tertiary} p-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{event.title}</p>
                  <div className="flex gap-2">
                    <button
                      className={`text-xs px-2 py-1 rounded border ${tw.border.both} ${tw.hover.both}`}
                      onClick={() => handleEditEvent(event)}
                    >
                      {t('editEvent')}
                    </button>
                    <button
                      className={`text-xs px-2 py-1 rounded border ${tw.border.both} ${tw.hover.both}`}
                      onClick={() => handleDeleteEvent(event)}
                    >
                      {t('deleteEvent')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className={`mt-4 w-full px-3 py-2 text-sm rounded border ${tw.border.both} ${tw.bg.both.tertiary} ${tw.hover.both} disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={handleClearAll}
        disabled={!store.hasEvents}
      >
        {t('clearAll')}
      </button>
    </aside>
  )
})

export default EventSidebar
