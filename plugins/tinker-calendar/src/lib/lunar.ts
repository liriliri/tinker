import calendar from 'js-calendar-converter'

const LUNAR_DAYS = [
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十',
]

const LUNAR_MONTHS = [
  '正月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '冬月',
  '腊月',
]

export function getLunarDate(date: Date): string {
  try {
    const lunar = calendar.solar2lunar(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    )

    if (!lunar) return ''

    const { lMonth, lDay } = lunar

    if (lDay === 1) {
      return LUNAR_MONTHS[lMonth - 1]
    }

    return LUNAR_DAYS[lDay - 1]
  } catch (error) {
    console.error('Failed to convert to lunar date:', error)
    return ''
  }
}
