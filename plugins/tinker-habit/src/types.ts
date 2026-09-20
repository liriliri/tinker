export type ScheduleType = 'weekdays' | 'weekly' | 'monthly'

export type Habit = {
  id: string
  title: string
  color: string
  scheduleType: ScheduleType
  /** 0 = Sunday … 6 = Saturday */
  weekdays: number[]
  weeklyTarget: number
  monthlyTarget: number
  createdAt: string
  endedAt: string | null
}

export type CheckIn = {
  id: string
  habitId: string
  date: string
}

export type HabitFormData = {
  title: string
  color: string
  scheduleType: ScheduleType
  weekdays: number[]
  weeklyTarget: number
  monthlyTarget: number
}

export type PeriodProgress = {
  done: number
  target: number
  complete: boolean
}

export type HabitStats = {
  expected: number
  completed: number
  rate: number
  streak: number
  period: PeriodProgress
}

export type SidebarTab = 'day' | 'habits'

export type DayHabitItem = {
  habit: Habit
  checked: boolean
  period: PeriodProgress
  canToggle: boolean
}
