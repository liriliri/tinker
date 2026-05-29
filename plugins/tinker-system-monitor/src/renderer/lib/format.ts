import type { TFunction } from 'i18next'

export function formatUptime(t: TFunction, seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)

  const parts: string[] = []
  if (d > 0) parts.push(t('uptimeDays', { value: d }))
  if (h > 0) parts.push(t('uptimeHours', { value: h }))
  if (parts.length < 2 && m > 0) parts.push(t('uptimeMinutes', { value: m }))
  if (parts.length === 0) parts.push(t('uptimeMinutes', { value: 0 }))

  return `${t('uptimePrefix')} ${parts.slice(0, 2).join(' ')}`
}
