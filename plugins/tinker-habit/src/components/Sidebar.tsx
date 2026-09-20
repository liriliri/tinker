import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import type { MenuItemConstructorOptions } from 'electron'
import className from 'licia/className'
import contain from 'licia/contain'
import filter from 'licia/filter'
import map from 'licia/map'
import { Check, Calendar, List, Pause, Pencil, Trash2 } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import { formatRate, WEEKDAY_ORDER } from '../lib/habit'
import store from '../store'
import type { DayHabitItem, Habit } from '../types'

function scheduleLabel(
  habit: Habit,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (habit.scheduleType === 'weekdays') {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    return map(
      filter(WEEKDAY_ORDER, (day) => contain(habit.weekdays, day)),
      (day) => t(keys[day])
    ).join(' ')
  }
  if (habit.scheduleType === 'weekly') {
    return t('weeklyTimes', { count: habit.weeklyTarget })
  }
  return t('monthlyTimes', { count: habit.monthlyTarget })
}

interface DayItemProps {
  item: DayHabitItem
  onToggle: () => void
}

function DayItem({ item, onToggle }: DayItemProps) {
  const { t } = useTranslation()
  const { habit, checked, period, canToggle } = item
  const disabled = !canToggle && !checked
  const showProgress = habit.scheduleType !== 'weekdays'

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={className(
        'w-full flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors',
        tw.border,
        tw.bg.primary,
        disabled ? 'opacity-50 cursor-not-allowed' : tw.hover
      )}
    >
      <span
        className={className(
          'flex items-center justify-center w-6 h-6 rounded-full border shrink-0',
          checked ? 'border-transparent text-white' : tw.border
        )}
        style={checked ? { backgroundColor: habit.color } : undefined}
      >
        {checked && <Check size={14} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm truncate ${tw.text.primary}`}>
          {habit.title}
        </div>
        {showProgress && (
          <div className={`text-[11px] ${tw.text.tertiary}`}>
            {t('periodProgress', {
              done: period.done,
              target: period.target,
            })}
          </div>
        )}
      </div>
    </button>
  )
}

interface HabitRowProps {
  habit: Habit
  onEdit: () => void
  onEnd: () => void
  onDelete: () => void
}

function HabitRow({ habit, onEdit, onEnd, onDelete }: HabitRowProps) {
  const { t } = useTranslation()
  const stats = store.getHabitStats(habit)
  const ended = !!habit.endedAt

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    const items: MenuItemConstructorOptions[] = [
      {
        label: t('editHabit'),
        click: onEdit,
      },
    ]
    if (!ended) {
      items.push({
        label: t('endHabit'),
        click: onEnd,
      })
    }
    items.push({
      label: t('deleteHabit'),
      click: onDelete,
    })
    tinker.showContextMenu(event.clientX, event.clientY, items)
  }

  return (
    <div
      className={className(
        'rounded-md border px-2.5 py-2',
        tw.border,
        tw.bg.primary,
        ended && 'opacity-70'
      )}
      onContextMenu={handleContextMenu}
      onDoubleClick={onEdit}
    >
      <div className="flex items-start gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: habit.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm truncate ${tw.text.primary}`}>
              {habit.title}
            </span>
            {ended && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${tw.bg.secondary} ${tw.text.tertiary}`}
              >
                {t('ended')}
              </span>
            )}
          </div>
          <div className={`text-[11px] mt-0.5 ${tw.text.tertiary}`}>
            {scheduleLabel(habit, t)}
          </div>
          <div
            className={`flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] mt-1.5 ${tw.text.secondary}`}
          >
            <span>
              {t('completionRate')}: {formatRate(stats.rate)}
            </span>
            <span>
              {t('streak')}: {stats.streak}
            </span>
            <span>
              {t('periodProgress', {
                done: stats.period.done,
                target: stats.period.target,
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
            title={t('editHabit')}
            onClick={onEdit}
          >
            <Pencil size={14} />
          </button>
          {!ended && (
            <button
              type="button"
              className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
              title={t('endHabit')}
              onClick={onEnd}
            >
              <Pause size={14} />
            </button>
          )}
          <button
            type="button"
            className={`p-1 rounded ${tw.hover} ${tw.text.secondary}`}
            title={t('deleteHabit')}
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

const HabitRowView = observer(HabitRow)

export default observer(function Sidebar() {
  const { t } = useTranslation()

  const handleEnd = async (habit: Habit) => {
    const ok = await confirm({
      title: t('endHabitTitle'),
      message: t('endHabitMessage', { title: habit.title }),
    })
    if (ok) store.endHabit(habit.id)
  }

  const handleDelete = async (habit: Habit) => {
    const ok = await confirm({
      title: t('deleteHabitTitle'),
      message: t('deleteHabitMessage', { title: habit.title }),
    })
    if (ok) store.removeHabit(habit.id)
  }

  return (
    <div
      className={`w-72 h-full flex flex-col border-t ${tw.border} ${tw.bg.tertiary}`}
    >
      <OverlayScrollbars className="flex-1 min-h-0">
        <div
          className={className(
            'p-2.5 flex flex-col gap-2',
            ((store.sidebarTab === 'day' && store.dayHabitItems.length === 0) ||
              (store.sidebarTab === 'habits' && store.habits.length === 0)) &&
              'h-full'
          )}
        >
          {store.sidebarTab === 'day' ? (
            store.dayHabitItems.length === 0 ? (
              <div
                className={`flex-1 flex items-center justify-center text-xs ${tw.text.tertiary}`}
              >
                {t('emptyDay')}
              </div>
            ) : (
              map(store.dayHabitItems, (item) => (
                <DayItem
                  key={item.habit.id}
                  item={item}
                  onToggle={() => {
                    if (!item.canToggle) return
                    store.toggleCheckIn(item.habit.id, store.selectedDate)
                  }}
                />
              ))
            )
          ) : store.habits.length === 0 ? (
            <div
              className={`flex-1 flex items-center justify-center text-xs ${tw.text.tertiary}`}
            >
              {t('emptyHabits')}
            </div>
          ) : (
            <>
              {map(store.activeHabits, (habit) => (
                <HabitRowView
                  key={habit.id}
                  habit={habit}
                  onEdit={() => store.openHabitDialog(habit.id)}
                  onEnd={() => handleEnd(habit)}
                  onDelete={() => handleDelete(habit)}
                />
              ))}
              {store.endedHabits.length > 0 && (
                <>
                  <div
                    className={`text-[11px] px-0.5 pt-2 ${tw.text.tertiary}`}
                  >
                    {t('endedHabits')}
                  </div>
                  {map(store.endedHabits, (habit) => (
                    <HabitRowView
                      key={habit.id}
                      habit={habit}
                      onEdit={() => store.openHabitDialog(habit.id)}
                      onEnd={() => handleEnd(habit)}
                      onDelete={() => handleDelete(habit)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </OverlayScrollbars>

      <div className={`flex border-t ${tw.border} ${tw.bg.primary}`}>
        <button
          type="button"
          className={className(
            'flex-1 flex items-center justify-center py-2 px-3 transition-colors',
            tw.hover,
            store.sidebarTab === 'day' ? tw.primary.text : tw.text.secondary
          )}
          onClick={() => store.setSidebarTab('day')}
          title={t('tabDay')}
        >
          <Calendar size={16} />
        </button>
        <button
          type="button"
          className={className(
            'flex-1 flex items-center justify-center py-2 px-3 transition-colors',
            tw.hover,
            store.sidebarTab === 'habits' ? tw.primary.text : tw.text.secondary
          )}
          onClick={() => store.setSidebarTab('habits')}
          title={t('tabHabits')}
        >
          <List size={16} />
        </button>
      </div>
    </div>
  )
})
