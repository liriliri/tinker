import defaults from 'licia/defaults'
import contain from 'licia/contain'
import trim from 'licia/trim'
import isUrl from 'licia/isUrl'
import isStrBlank from 'licia/isStrBlank'
import lowerCase from 'licia/lowerCase'
import filter from 'licia/filter'
import splitPath from 'licia/splitPath'
import type { Action, ActionType } from '../types'

const ACTION_TYPES: ActionType[] = [
  'command',
  'plugin',
  'app',
  'directory',
  'url',
]

export function normalizeAction(
  raw: Partial<Action> & { id: string; shortcut?: string }
): Action {
  const { shortcut: legacyShortcut, ...rest } = raw
  const action = defaults(
    {
      ...rest,
      hotkey: rest.hotkey || legacyShortcut || '',
    },
    {
      name: '',
      hotkey: '',
      enabled: true,
      type: 'command' as ActionType,
      command: '',
    }
  )
  if (!contain(ACTION_TYPES, action.type)) {
    action.type = 'command'
  }
  return action as Action
}

export function ensureUrl(url: string) {
  const trimmed = trim(url)
  if (isUrl(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function folderName(dirPath: string) {
  return splitPath(dirPath).name || dirPath
}

export function actionUsesIcon(type: ActionType) {
  return type === 'app' || type === 'plugin'
}

export function filterByName<T extends { name: string }>(
  items: T[],
  query: string
) {
  if (isStrBlank(query)) return items
  const q = lowerCase(query)
  return filter(items, (item) => contain(lowerCase(item.name), q))
}
