import { THEME_COLORS } from 'share/theme'
import clamp from 'licia/clamp'
import contain from 'licia/contain'
import filter from 'licia/filter'
import find from 'licia/find'
import map from 'licia/map'
import sortBy from 'licia/sortBy'
import trim from 'licia/trim'
import {
  addDays,
  compareDateKeys,
  eachDate,
  getMonthParts,
  getMonthRange,
  getWeekRange,
  getWeekday,
  maxDateKey,
  minDateKey,
  todayKey,
} from './date'
import type {
  CheckIn,
  DayHabitItem,
  Habit,
  HabitFormData,
  HabitStats,
  PeriodProgress,
} from '../types'

/** Distinct habit swatches; primary matches app theme. */
export const HABIT_COLORS = [
  THEME_COLORS.primary,
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

/** Monday-first weekday order for UI (values are JS getDay()). */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5]

export function defaultHabitForm(): HabitFormData {
  return {
    title: '',
    color: HABIT_COLORS[0],
    scheduleType: 'weekdays',
    weekdays: [...DEFAULT_WEEKDAYS],
    weeklyTarget: 3,
    monthlyTarget: 10,
  }
}

export function toHabit(
  id: string,
  data: HabitFormData,
  createdAt: string
): Habit {
  return {
    id,
    title: trim(data.title),
    color: data.color || HABIT_COLORS[0],
    scheduleType: data.scheduleType,
    weekdays:
      data.scheduleType === 'weekdays' && data.weekdays.length > 0
        ? sortBy(data.weekdays)
        : [...DEFAULT_WEEKDAYS],
    weeklyTarget: clamp(data.weeklyTarget || 3, 1, 7),
    monthlyTarget: clamp(data.monthlyTarget || 10, 1, 31),
    createdAt,
    endedAt: null,
  }
}

export function isHabitActive(habit: Habit, dateKey: string): boolean {
  if (compareDateKeys(dateKey, habit.createdAt) < 0) return false
  if (habit.endedAt && compareDateKeys(dateKey, habit.endedAt) > 0) {
    return false
  }
  return true
}

export function isDueOnDate(habit: Habit, dateKey: string): boolean {
  if (!isHabitActive(habit, dateKey)) return false
  if (habit.scheduleType === 'weekdays') {
    return contain(habit.weekdays, getWeekday(dateKey))
  }
  return true
}

function findCheckIn(
  checkIns: CheckIn[],
  habitId: string,
  dateKey: string
): CheckIn | undefined {
  return find(
    checkIns,
    (item) => item.habitId === habitId && item.date === dateKey
  )
}

export function hasCheckIn(
  checkIns: CheckIn[],
  habitId: string,
  dateKey: string
): boolean {
  return !!findCheckIn(checkIns, habitId, dateKey)
}

export function countCheckInsInRange(
  checkIns: CheckIn[],
  habitId: string,
  start: string,
  end: string
): number {
  return filter(
    checkIns,
    (item) =>
      item.habitId === habitId &&
      compareDateKeys(item.date, start) >= 0 &&
      compareDateKeys(item.date, end) <= 0
  ).length
}

export function getPeriodProgress(
  habit: Habit,
  checkIns: CheckIn[],
  dateKey: string
): PeriodProgress {
  if (habit.scheduleType === 'weekdays') {
    const done = hasCheckIn(checkIns, habit.id, dateKey) ? 1 : 0
    return { done, target: 1, complete: done >= 1 }
  }

  if (habit.scheduleType === 'weekly') {
    const { start, end } = getWeekRange(dateKey)
    const done = countCheckInsInRange(checkIns, habit.id, start, end)
    return {
      done,
      target: habit.weeklyTarget,
      complete: done >= habit.weeklyTarget,
    }
  }

  const { year, month } = getMonthParts(dateKey)
  const { start, end } = getMonthRange(year, month)
  const done = countCheckInsInRange(checkIns, habit.id, start, end)
  return {
    done,
    target: habit.monthlyTarget,
    complete: done >= habit.monthlyTarget,
  }
}

export function canToggleCheckIn(habit: Habit, dateKey: string): boolean {
  if (compareDateKeys(dateKey, todayKey()) > 0) return false
  return isDueOnDate(habit, dateKey)
}

function getStatsEnd(habit: Habit, upTo: string): string {
  if (habit.endedAt) return minDateKey(habit.endedAt, upTo)
  return upTo
}

export function getHabitStats(
  habit: Habit,
  checkIns: CheckIn[],
  upTo: string = todayKey()
): HabitStats {
  const end = getStatsEnd(habit, upTo)
  let expected = 0
  let completed = 0

  if (compareDateKeys(end, habit.createdAt) < 0) {
    return {
      expected: 0,
      completed: 0,
      rate: 0,
      streak: 0,
      period: getPeriodProgress(habit, checkIns, upTo),
    }
  }

  if (habit.scheduleType === 'weekdays') {
    eachDate(habit.createdAt, end, (dateKey) => {
      if (!contain(habit.weekdays, getWeekday(dateKey))) return
      expected += 1
      if (hasCheckIn(checkIns, habit.id, dateKey)) completed += 1
    })
  } else if (habit.scheduleType === 'weekly') {
    let weekStart = getWeekRange(habit.createdAt).start
    while (compareDateKeys(weekStart, end) <= 0) {
      const weekEnd = addDays(weekStart, 6)
      const rangeStart = maxDateKey(weekStart, habit.createdAt)
      const rangeEnd = minDateKey(weekEnd, end)
      if (compareDateKeys(rangeStart, rangeEnd) <= 0) {
        expected += habit.weeklyTarget
        completed += Math.min(
          habit.weeklyTarget,
          countCheckInsInRange(checkIns, habit.id, rangeStart, rangeEnd)
        )
      }
      weekStart = addDays(weekStart, 7)
    }
  } else {
    let cursor = habit.createdAt
    while (compareDateKeys(cursor, end) <= 0) {
      const { year, month } = getMonthParts(cursor)
      const { start, end: monthEnd } = getMonthRange(year, month)
      const rangeStart = maxDateKey(start, habit.createdAt)
      const rangeEnd = minDateKey(monthEnd, end)
      expected += habit.monthlyTarget
      completed += Math.min(
        habit.monthlyTarget,
        countCheckInsInRange(checkIns, habit.id, rangeStart, rangeEnd)
      )
      cursor = normalizeNextMonth(year, month)
    }
  }

  return {
    expected,
    completed,
    rate: expected === 0 ? 0 : completed / expected,
    streak: getStreak(habit, checkIns, end),
    period: getPeriodProgress(habit, checkIns, upTo),
  }
}

function normalizeNextMonth(year: number, month: number): string {
  return getMonthRange(year, month + 1).start
}

function getStreak(habit: Habit, checkIns: CheckIn[], end: string): number {
  let streak = 0
  let cursor = end

  while (compareDateKeys(cursor, habit.createdAt) >= 0) {
    if (!isDueOnDate(habit, cursor)) {
      cursor = addDays(cursor, -1)
      continue
    }
    if (!hasCheckIn(checkIns, habit.id, cursor)) break
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

export function getDayHabitItems(
  habits: Habit[],
  checkIns: CheckIn[],
  dateKey: string
): DayHabitItem[] {
  return map(
    filter(habits, (habit) => isDueOnDate(habit, dateKey)),
    (habit) => ({
      habit,
      checked: hasCheckIn(checkIns, habit.id, dateKey),
      period: getPeriodProgress(habit, checkIns, dateKey),
      canToggle: canToggleCheckIn(habit, dateKey),
    })
  )
}

export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
