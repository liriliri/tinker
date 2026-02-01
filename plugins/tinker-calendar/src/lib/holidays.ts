export type Holiday = {
  id: string
  nameKey: string // i18n translation key
  month: number // 1-12
  day?: number // For fixed date holidays
  weekOfMonth?: number // For floating holidays (1-5)
  dayOfWeek?: number // 0=Sunday, 1=Monday, etc.
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
  endYear: number
): Array<{ date: string; nameKey: string; id: string }> {
  const result: Array<{ date: string; nameKey: string; id: string }> = []

  for (let year = startYear; year <= endYear; year++) {
    for (const holiday of HOLIDAYS) {
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
  }

  return result
}
