import contain from 'licia/contain'
import isStr from 'licia/isStr'

export const PLUGIN_PREFIX = 'tinker-web-'

export const PLUGIN_CATEGORIES = [
  'dev',
  'file',
  'media',
  'productivity',
  'system',
  'entertainment',
] as const

export type PluginCategory = (typeof PLUGIN_CATEGORIES)[number]

export function isPluginCategory(value: unknown): value is PluginCategory {
  return (
    isStr(value) && contain(PLUGIN_CATEGORIES as unknown as string[], value)
  )
}

export interface WebApp {
  id: string
  name: string
  url: string
  description: string
  category: PluginCategory
  icon: string
}

export interface WebAppInput {
  /** Full plugin id, e.g. tinker-web-deepseek. Only used when creating. */
  id?: string
  name: string
  url: string
  description?: string
  category: PluginCategory
  /** Absolute path to a local icon image; omit to use the default plugin icon */
  iconPath?: string
}
