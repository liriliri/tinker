import calendar from 'js-calendar-converter'
import dateFormat from 'licia/dateFormat'
import filter from 'licia/filter'
import { addI18nNamespace } from './i18n'

export const HOLIDAYS_NS = 'holidays'

addI18nNamespace(HOLIDAYS_NS, {
  'en-US': {
    newYear: "New Year's Day",
    valentines: "Valentine's Day",
    laborDay: 'Labor Day',
    mothersDay: "Mother's Day",
    fathersDay: "Father's Day",
    thanksgiving: 'Thanksgiving',
    christmasEve: 'Christmas Eve',
    christmas: 'Christmas',
    womensDay: "International Women's Day",
    arborDay: 'Arbor Day',
    qingmingFestival: 'Qingming Festival',
    childrensDay: "Children's Day",
    partyFoundingDay: 'CPC Founding Day',
    armyDay: 'Army Day',
    nationalDay: 'National Day',
    springFestival: 'Spring Festival',
    lanternFestival: 'Lantern Festival',
    dragonBoatFestival: 'Dragon Boat Festival',
    qixiFestival: 'Qixi Festival',
    midAutumnFestival: 'Mid-Autumn Festival',
    doubleNinthFestival: 'Double Ninth Festival',
  },
  'zh-CN': {
    newYear: '元旦',
    valentines: '情人节',
    laborDay: '劳动节',
    mothersDay: '母亲节',
    fathersDay: '父亲节',
    thanksgiving: '感恩节',
    christmasEve: '平安夜',
    christmas: '圣诞节',
    womensDay: '妇女节',
    arborDay: '植树节',
    qingmingFestival: '清明节',
    childrensDay: '儿童节',
    partyFoundingDay: '建党节',
    armyDay: '建军节',
    nationalDay: '国庆节',
    springFestival: '春节',
    lanternFestival: '元宵节',
    dragonBoatFestival: '端午节',
    qixiFestival: '七夕节',
    midAutumnFestival: '中秋节',
    doubleNinthFestival: '重阳节',
  },
})

export type Holiday = {
  id: string
  nameKey: string
  month: number
  day?: number
  weekOfMonth?: number
  dayOfWeek?: number
  locale?: string
  isLunar?: boolean
  lunarMonth?: number
  lunarDay?: number
}

export type HolidayTemplate = Holiday

export type HolidayInstance = {
  date: string
  nameKey: string
  id: string
}

export const HOLIDAYS: Holiday[] = [
  { id: 'new-year', nameKey: 'newYear', month: 1, day: 1 },
  { id: 'valentines', nameKey: 'valentines', month: 2, day: 14 },
  { id: 'labor-day', nameKey: 'laborDay', month: 5, day: 1 },
  { id: 'christmas-eve', nameKey: 'christmasEve', month: 12, day: 24 },
  { id: 'christmas', nameKey: 'christmas', month: 12, day: 25 },
  {
    id: 'mothers-day',
    nameKey: 'mothersDay',
    month: 5,
    weekOfMonth: 2,
    dayOfWeek: 0,
  },
  {
    id: 'fathers-day',
    nameKey: 'fathersDay',
    month: 6,
    weekOfMonth: 3,
    dayOfWeek: 0,
  },
  {
    id: 'thanksgiving',
    nameKey: 'thanksgiving',
    month: 11,
    weekOfMonth: 4,
    dayOfWeek: 4,
  },
]

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

const QINGMING_HOLIDAY: Holiday = {
  id: 'qingming-festival',
  nameKey: 'qingmingFestival',
  month: 4,
  locale: 'zh-CN',
}

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

function formatHolidayDate(date: Date): string {
  return dateFormat(date, 'yyyy-mm-dd')
}

function getFloatingHolidayDate(
  year: number,
  month: number,
  weekOfMonth: number,
  dayOfWeek: number
): Date {
  const firstDay = new Date(year, month - 1, 1)
  const firstDayOfWeek = firstDay.getDay()
  let daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7
  daysToAdd += (weekOfMonth - 1) * 7
  return new Date(year, month - 1, 1 + daysToAdd)
}

function getQingmingDate(year: number): Date {
  const centuryCoefficient = year >= 2000 ? 5.59 : 4.81
  const yearOfCentury = year % 100
  let day =
    Math.floor(yearOfCentury * 0.2422 + centuryCoefficient) -
    Math.floor(yearOfCentury / 4)

  if (year === 1902 || year === 2008) {
    day += 1
  }

  return new Date(year, 3, day)
}

export function getHolidayTemplates(locale?: string): HolidayTemplate[] {
  const allHolidays: HolidayTemplate[] = [
    ...HOLIDAYS,
    ...CHINESE_SOLAR_HOLIDAYS,
  ]
  let templates = locale
    ? filter(allHolidays, (h) => !h.locale || h.locale === locale)
    : filter(allHolidays, (h) => !h.locale)

  if (locale === 'zh-CN') {
    templates = [...templates, ...CHINESE_LUNAR_HOLIDAYS, QINGMING_HOLIDAY]
  }

  return templates
}

export function getHolidayDateForYear(
  holiday: HolidayTemplate,
  year: number
): string | null {
  if (holiday.id === 'qingming-festival') {
    return formatHolidayDate(getQingmingDate(year))
  }

  if (holiday.isLunar && holiday.lunarMonth && holiday.lunarDay) {
    const solarDate = lunarToSolar(year, holiday.lunarMonth, holiday.lunarDay)
    return solarDate ? formatHolidayDate(solarDate) : null
  }

  if (holiday.day !== undefined) {
    return formatHolidayDate(new Date(year, holiday.month - 1, holiday.day))
  }

  if (holiday.weekOfMonth !== undefined && holiday.dayOfWeek !== undefined) {
    return formatHolidayDate(
      getFloatingHolidayDate(
        year,
        holiday.month,
        holiday.weekOfMonth,
        holiday.dayOfWeek
      )
    )
  }

  return null
}

export function getHolidaysForYearRange(
  startYear: number,
  endYear: number,
  locale?: string
): HolidayInstance[] {
  const result: HolidayInstance[] = []
  const templates = getHolidayTemplates(locale)

  for (let year = startYear; year <= endYear; year++) {
    for (const holiday of templates) {
      const date = getHolidayDateForYear(holiday, year)
      if (!date) continue

      result.push({
        id: `${holiday.id}-${year}`,
        date,
        nameKey: holiday.nameKey,
      })
    }
  }

  return result
}
