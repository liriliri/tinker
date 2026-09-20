import { makeAutoObservable } from 'mobx'
import compact from 'licia/compact'
import filter from 'licia/filter'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import isNil from 'licia/isNil'
import map from 'licia/map'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import BaseStore, { storage } from 'share/store/Base'
import {
  getDayHabitItems,
  getHabitStats,
  hasCheckIn,
  isDueOnDate,
  toHabit,
} from './lib/habit'
import { normalizeDateKey, todayKey } from './lib/date'
import * as db from './lib/db'
import type { CheckIn, Habit, HabitFormData, SidebarTab } from './types'
import { createMcpApi } from './mcp'

const STORAGE_SIDEBAR_OPEN = 'sidebarOpen'
const STORAGE_SIDEBAR_TAB = 'sidebarTab'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  selectedDate: string = todayKey()
  habits: Habit[] = []
  checkIns: CheckIn[] = []
  sidebarOpen = true
  sidebarTab: SidebarTab = 'day'
  dialogOpen = false
  editingHabitId: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private async loadStorage() {
    try {
      const savedSidebar = storage.get(STORAGE_SIDEBAR_OPEN)
      if (!isNil(savedSidebar)) {
        this.sidebarOpen = savedSidebar as boolean
      }

      const savedTab = storage.get(STORAGE_SIDEBAR_TAB)
      if (savedTab === 'day' || savedTab === 'habits') {
        this.sidebarTab = savedTab
      }

      const [habits, checkIns] = await Promise.all([
        db.getAllHabits(),
        db.getAllCheckIns(),
      ])
      this.habits = habits
      this.checkIns = checkIns
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  }

  setSelectedDate(value: string | Date) {
    this.selectedDate = normalizeDateKey(value)
  }

  setToday() {
    this.selectedDate = todayKey()
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setSidebarTab(tab: SidebarTab) {
    this.sidebarTab = tab
    storage.set(STORAGE_SIDEBAR_TAB, tab)
  }

  openHabitDialog(habitId?: string) {
    this.editingHabitId = habitId || null
    this.dialogOpen = true
  }

  closeHabitDialog() {
    this.dialogOpen = false
    this.editingHabitId = null
  }

  addHabit(data: HabitFormData) {
    if (!trim(data.title)) return

    const habit = toHabit(uuid(), data, todayKey())
    this.habits = [...this.habits, habit]
    db.putHabit(habit)
  }

  updateHabit(id: string, data: HabitFormData) {
    if (!trim(data.title)) return

    const idx = findIdx(this.habits, (item) => item.id === id)
    if (idx === -1) return

    const existing = this.habits[idx]
    const updated: Habit = {
      ...toHabit(id, data, existing.createdAt),
      endedAt: existing.endedAt,
    }

    this.habits = map(this.habits, (item, i) => (i === idx ? updated : item))
    db.putHabit(updated)
  }

  endHabit(id: string) {
    const idx = findIdx(this.habits, (item) => item.id === id)
    if (idx === -1) return

    const habit = this.habits[idx]
    if (habit.endedAt) return

    const updated: Habit = { ...habit, endedAt: todayKey() }
    this.habits = map(this.habits, (item, i) => (i === idx ? updated : item))
    db.putHabit(updated)
  }

  removeHabit(id: string) {
    this.habits = filter(this.habits, (item) => item.id !== id)
    this.checkIns = filter(this.checkIns, (item) => item.habitId !== id)
    db.removeHabit(id)
  }

  toggleCheckIn(habitId: string, dateKey: string = this.selectedDate) {
    const habit = this.getHabitById(habitId)
    if (!habit || !isDueOnDate(habit, dateKey)) return
    if (dateKey > todayKey()) return

    const existing = find(
      this.checkIns,
      (item) => item.habitId === habitId && item.date === dateKey
    )

    if (existing) {
      this.checkIns = filter(this.checkIns, (item) => item.id !== existing.id)
      db.removeCheckIn(existing.id)
      return
    }

    const checkIn: CheckIn = {
      id: uuid(),
      habitId,
      date: dateKey,
    }
    this.checkIns = [...this.checkIns, checkIn]
    db.putCheckIn(checkIn)
  }

  setCheckIn(habitId: string, dateKey: string, checked: boolean) {
    const isChecked = hasCheckIn(this.checkIns, habitId, dateKey)
    if (checked === isChecked) return
    this.toggleCheckIn(habitId, dateKey)
  }

  getHabitById(id: string) {
    return find(this.habits, (item) => item.id === id)
  }

  get dayHabitItems() {
    return getDayHabitItems(this.habits, this.checkIns, this.selectedDate)
  }

  get activeHabits() {
    return filter(this.habits, (habit) => !habit.endedAt)
  }

  get endedHabits() {
    return filter(this.habits, (habit) => !!habit.endedAt)
  }

  getHabitStats(habit: Habit) {
    return getHabitStats(habit, this.checkIns, todayKey())
  }

  get calendarEvents() {
    return compact(
      map(this.checkIns, (checkIn) => {
        const habit = this.getHabitById(checkIn.habitId)
        if (!habit) return null
        return {
          id: checkIn.id,
          title: habit.title,
          start: checkIn.date,
          allDay: true,
          backgroundColor: habit.color,
          borderColor: habit.color,
        }
      })
    )
  }

  get editingHabit() {
    if (!this.editingHabitId) return null
    return this.getHabitById(this.editingHabitId) || null
  }
}

export default new Store()
