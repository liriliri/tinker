import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { formatRate, getHabitStats } from './lib/habit'
import { normalizeDateKey, todayKey } from './lib/date'
import type { Habit, HabitFormData, ScheduleType } from './types'
import type { Store } from './store'
import pkg from '../package.json'
import trim from 'licia/trim'

type HabitArgs = {
  id?: string
  title?: string
  scheduleType?: ScheduleType
  weekdays?: number[]
  weeklyTarget?: number
  monthlyTarget?: number
  color?: string
}

type CheckInArgs = {
  id: string
  date?: string
  checked?: boolean
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    list: (store) => listHabits(store),
    add: addHabit,
    update: updateHabit,
    check_in: checkIn,
    end: endHabit,
    delete: deleteHabit,
  })
}

function serializeHabit(store: Store, habit: Habit) {
  const stats = getHabitStats(habit, store.checkIns, todayKey())
  return {
    id: habit.id,
    title: habit.title,
    color: habit.color,
    scheduleType: habit.scheduleType,
    weekdays: habit.weekdays,
    weeklyTarget: habit.weeklyTarget,
    monthlyTarget: habit.monthlyTarget,
    createdAt: habit.createdAt,
    endedAt: habit.endedAt,
    status: habit.endedAt ? 'ended' : 'active',
    completionRate: formatRate(stats.rate),
    expected: stats.expected,
    completed: stats.completed,
    streak: stats.streak,
    periodDone: stats.period.done,
    periodTarget: stats.period.target,
  }
}

function listHabits(store: Store) {
  return {
    selectedDate: store.selectedDate,
    habits: store.habits.map((habit) => serializeHabit(store, habit)),
  }
}

function requireHabit(store: Store, id: string): Habit {
  const habit = store.getHabitById(id)
  if (!habit) {
    throw new Error(`Habit with id "${id}" not found.`)
  }
  return habit
}

function parseHabitForm(args: HabitArgs, existing?: Habit): HabitFormData {
  const title =
    args.title !== undefined ? trim(args.title) : existing?.title ?? ''
  if (!title) {
    throw new Error('title is required and cannot be empty.')
  }

  const scheduleType = args.scheduleType ?? existing?.scheduleType ?? 'weekdays'

  return {
    title,
    color: args.color ?? existing?.color ?? '',
    scheduleType,
    weekdays: args.weekdays ?? existing?.weekdays ?? [1, 2, 3, 4, 5],
    weeklyTarget: args.weeklyTarget ?? existing?.weeklyTarget ?? 3,
    monthlyTarget: args.monthlyTarget ?? existing?.monthlyTarget ?? 10,
  }
}

function addHabit(store: Store, args: HabitArgs) {
  if (!args.scheduleType) {
    throw new Error('scheduleType is required.')
  }
  const data = parseHabitForm(args)
  if (data.scheduleType === 'weekdays' && data.weekdays.length === 0) {
    throw new Error('weekdays is required when scheduleType is weekdays.')
  }
  store.addHabit(data)
  return listHabits(store)
}

function updateHabit(store: Store, args: HabitArgs & { id: string }) {
  const existing = requireHabit(store, args.id)
  const data = parseHabitForm(args, existing)
  store.updateHabit(args.id, data)
  return listHabits(store)
}

function checkIn(store: Store, args: CheckInArgs) {
  requireHabit(store, args.id)
  const date = args.date ? normalizeDateKey(args.date) : todayKey()

  if (args.checked === undefined) {
    store.toggleCheckIn(args.id, date)
  } else {
    store.setCheckIn(args.id, date, args.checked)
  }

  return {
    ...listHabits(store),
    date,
  }
}

function endHabit(store: Store, args: { id: string }) {
  requireHabit(store, args.id)
  store.endHabit(args.id)
  return listHabits(store)
}

function deleteHabit(store: Store, args: { id: string }) {
  requireHabit(store, args.id)
  store.removeHabit(args.id)
  return listHabits(store)
}
