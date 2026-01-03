// Format timestamp to relative time
export function formatRelativeTime(
  timestamp: number,
  t: (key: string, options?: any) => string
): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return t('timeJustNow')
  } else if (minutes < 60) {
    return t('timeMinutesAgo', { count: minutes })
  } else if (hours < 24) {
    return t('timeHoursAgo', { count: hours })
  } else {
    return t('timeDaysAgo', { count: days })
  }
}
