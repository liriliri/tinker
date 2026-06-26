export type Anniversary = {
  id: string
  title: string
  isLunar: boolean
  month?: number
  day?: number
  lunarMonth?: number
  lunarDay?: number
  startYear?: number
}

export type SidebarItem = {
  id: string
  title: string
  daysUntil: number
  daysSince?: number
  nextDate: string
  isHoliday: boolean
  isLunar: boolean
  anniversaryId?: string
}
