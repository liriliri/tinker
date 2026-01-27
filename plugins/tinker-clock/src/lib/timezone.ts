export function getTimeForTimezone(timezone: string): Date {
  if (timezone === 'local') {
    return new Date()
  }

  const now = new Date()

  if (timezone === 'UTC') {
    return new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  }

  return new Date(now.toLocaleString('en-US', { timeZone: timezone }))
}

export function formatTimeForTimezone(
  timezone: string,
  format: 'HH:mm:ss' | 'full' = 'full'
): string {
  const date = getTimeForTimezone(timezone)

  if (format === 'HH:mm:ss') {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  return date.toLocaleString()
}
