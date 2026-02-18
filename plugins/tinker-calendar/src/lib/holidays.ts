import calendar from 'js-calendar-converter'

export type Holiday = {
  id: string
  nameKey: string // i18n translation key
  month: number // 1-12
  day?: number // For fixed date holidays
  weekOfMonth?: number // For floating holidays (1-5)
  dayOfWeek?: number // 0=Sunday, 1=Monday, etc.
  locale?: string // Specific locale (e.g., 'zh-CN')
  isLunar?: boolean // Whether it's a lunar calendar date
  lunarMonth?: number // Lunar month (1-12)
  lunarDay?: number // Lunar day (1-30)
}

// Common international holidays
export const HOLIDAYS: Holiday[] = [
  // Fixed date holidays
  { id: 'new-year', nameKey: 'newYear', month: 1, day: 1 },
  { id: 'valentines', nameKey: 'valentines', month: 2, day: 14 },
  { id: 'labor-day', nameKey: 'laborDay', month: 5, day: 1 },
  { id: 'christmas-eve', nameKey: 'christmasEve', month: 12, day: 24 },
  { id: 'christmas', nameKey: 'christmas', month: 12, day: 25 },

  // Floating holidays
  {
    id: 'mothers-day',
    nameKey: 'mothersDay',
    month: 5,
    weekOfMonth: 2,
    dayOfWeek: 0,
  }, // 2nd Sunday of May
  {
    id: 'fathers-day',
    nameKey: 'fathersDay',
    month: 6,
    weekOfMonth: 3,
    dayOfWeek: 0,
  }, // 3rd Sunday of June
  {
    id: 'thanksgiving',
    nameKey: 'thanksgiving',
    month: 11,
    weekOfMonth: 4,
    dayOfWeek: 4,
  }, // 4th Thursday of November
]

// Chinese holidays (solar calendar dates)
export const CHINESE_SOLAR_HOLIDAYS: Holiday[] = [
  { id: 'womens-day', nameKey: 'womensDay', month: 3, day: 8, locale: 'zh-CN' },
  {
    id: 'arbor-day',
    nameKey: 'arborDay',
    month: 3,
    day: 12,
    locale: 'zh-CN',
  },
  {
    id: 'childrens-day',
    nameKey: 'childrensDay',
    month: 6,
    day: 1,
    locale: 'zh-CN',
  },
  {
    id: 'party-founding-day',
    nameKey: 'partyFoundingDay',
    month: 7,
    day: 1,
    locale: 'zh-CN',
  },
  {
    id: 'army-day',
    nameKey: 'armyDay',
    month: 8,
    day: 1,
    locale: 'zh-CN',
  },
  {
    id: 'national-day',
    nameKey: 'nationalDay',
    month: 10,
    day: 1,
    locale: 'zh-CN',
  },
]

// Chinese holidays (lunar calendar dates)
export const CHINESE_LUNAR_HOLIDAYS: Holiday[] = [
  {
    id: 'spring-festival',
    nameKey: 'springFestival',
    month: 0,
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 1,
    locale: 'zh-CN',
  },
  {
    id: 'lantern-festival',
    nameKey: 'lanternFestival',
    month: 0,
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 15,
    locale: 'zh-CN',
  },
  {
    id: 'dragon-boat-festival',
    nameKey: 'dragonBoatFestival',
    month: 0,
    isLunar: true,
    lunarMonth: 5,
    lunarDay: 5,
    locale: 'zh-CN',
  },
  {
    id: 'qixi-festival',
    nameKey: 'qixiFestival',
    month: 0,
    isLunar: true,
    lunarMonth: 7,
    lunarDay: 7,
    locale: 'zh-CN',
  },
  {
    id: 'mid-autumn-festival',
    nameKey: 'midAutumnFestival',
    month: 0,
    isLunar: true,
    lunarMonth: 8,
    lunarDay: 15,
    locale: 'zh-CN',
  },
  {
    id: 'double-ninth-festival',
    nameKey: 'doubleNinthFestival',
    month: 0,
    isLunar: true,
    lunarMonth: 9,
    lunarDay: 9,
    locale: 'zh-CN',
  },
]

/**
 * Convert lunar date to solar date
 */
function lunarToSolar(year: number, lunarMonth: number, lunarDay: number) {
  try {
    const result = calendar.lunar2solar(year, lunarMonth, lunarDay)
    if (!result) return null
    return new Date(result.cYear, result.cMonth - 1, result.cDay)
  } catch (error) {
    console.error('Failed to convert lunar to solar date:', error)
    return null
  }
}

/**
 * Calculate the date for a floating holiday (e.g., 2nd Sunday of May)
 */
function getFloatingHolidayDate(
  year: number,
  month: number,
  weekOfMonth: number,
  dayOfWeek: number
): Date {
  const firstDay = new Date(year, month - 1, 1)
  const firstDayOfWeek = firstDay.getDay()

  // Calculate days to add to get to the first occurrence of the desired day
  let daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7

  // Add weeks to get to the desired week
  daysToAdd += (weekOfMonth - 1) * 7

  return new Date(year, month - 1, 1 + daysToAdd)
}

/**
 * Get all holidays for a given year range
 */
export function getHolidaysForYearRange(
  startYear: number,
  endYear: number,
  locale?: string
): Array<{ date: string; nameKey: string; id: string }> {
  const result: Array<{ date: string; nameKey: string; id: string }> = []

  // Filter holidays based on locale
  const allHolidays = [...HOLIDAYS, ...CHINESE_SOLAR_HOLIDAYS]
  const holidaysToProcess = locale
    ? allHolidays.filter((h) => !h.locale || h.locale === locale)
    : allHolidays.filter((h) => !h.locale)

  for (let year = startYear; year <= endYear; year++) {
    // Process solar calendar holidays
    for (const holiday of holidaysToProcess) {
      let date: Date

      if (holiday.day !== undefined) {
        // Fixed date holiday
        date = new Date(year, holiday.month - 1, holiday.day)
      } else if (
        holiday.weekOfMonth !== undefined &&
        holiday.dayOfWeek !== undefined
      ) {
        // Floating holiday
        date = getFloatingHolidayDate(
          year,
          holiday.month,
          holiday.weekOfMonth,
          holiday.dayOfWeek
        )
      } else {
        continue
      }

      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      result.push({
        id: `${holiday.id}-${year}`,
        date: dateStr,
        nameKey: holiday.nameKey,
      })
    }

    // Process lunar calendar holidays (Chinese only)
    if (locale === 'zh-CN') {
      for (const holiday of CHINESE_LUNAR_HOLIDAYS) {
        if (!holiday.lunarMonth || !holiday.lunarDay) continue

        const solarDate = lunarToSolar(
          year,
          holiday.lunarMonth,
          holiday.lunarDay
        )
        if (!solarDate) continue

        const dateStr = `${solarDate.getFullYear()}-${String(
          solarDate.getMonth() + 1
        ).padStart(2, '0')}-${String(solarDate.getDate()).padStart(2, '0')}`

        result.push({
          id: `${holiday.id}-${year}`,
          date: dateStr,
          nameKey: holiday.nameKey,
        })
      }
    }
  }

  return result
}
