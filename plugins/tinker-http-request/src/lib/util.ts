import { tw } from 'share/theme'

export const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-600 dark:text-green-500',
  POST: 'text-yellow-600 dark:text-yellow-500',
  PUT: 'text-blue-600 dark:text-blue-500',
  PATCH: 'text-purple-600 dark:text-purple-500',
  DELETE: 'text-red-600 dark:text-red-500',
  HEAD: 'text-cyan-600 dark:text-cyan-500',
  OPTIONS: 'text-gray-500 dark:text-gray-400',
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-500'
  if (status >= 300 && status < 400) return 'text-yellow-500'
  if (status >= 400 && status < 500) return 'text-orange-500'
  if (status >= 500) return 'text-red-500'
  return tw.text.tertiary
}
