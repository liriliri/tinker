import type { Category } from '../types'

export interface RuleDef {
  id: string
  category: Category
  nameKey: string
  pathTemplate: string
}

const rules: RuleDef[] = [
  // System temp
  {
    id: 'sys-tmp',
    category: 'system',
    nameKey: 'rule.systemTmp',
    pathTemplate: '/private/tmp',
  },
  {
    id: 'sys-var-tmp',
    category: 'system',
    nameKey: 'rule.systemVarTmp',
    pathTemplate: '/private/var/tmp',
  },

  // User cache
  {
    id: 'user-caches',
    category: 'userCache',
    nameKey: 'rule.userCaches',
    pathTemplate: '~/Library/Caches',
  },
  {
    id: 'user-logs',
    category: 'userCache',
    nameKey: 'rule.userLogs',
    pathTemplate: '~/Library/Logs',
  },

  // System log
  {
    id: 'sys-log',
    category: 'systemLog',
    nameKey: 'rule.systemLog',
    pathTemplate: '/private/var/log',
  },
  {
    id: 'crash-reports',
    category: 'systemLog',
    nameKey: 'rule.crashReports',
    pathTemplate: '~/Library/DiagnosticReports',
  },

  // App cache
  {
    id: 'saved-app-state',
    category: 'appCache',
    nameKey: 'rule.savedAppState',
    pathTemplate: '~/Library/Saved Application State',
  },
  {
    id: 'quicklook-cache',
    category: 'appCache',
    nameKey: 'rule.quicklookCache',
    pathTemplate: '~/Library/Caches/com.apple.QuickLook.thumbnailcache',
  },

  // Browser cache
  {
    id: 'safari-cache',
    category: 'browser',
    nameKey: 'rule.safariCache',
    pathTemplate: '~/Library/Caches/com.apple.Safari',
  },
  {
    id: 'chrome-cache',
    category: 'browser',
    nameKey: 'rule.chromeCache',
    pathTemplate: '~/Library/Caches/Google/Chrome',
  },
  {
    id: 'edge-cache',
    category: 'browser',
    nameKey: 'rule.edgeCache',
    pathTemplate: '~/Library/Caches/com.microsoft.edgemac',
  },
  {
    id: 'firefox-cache',
    category: 'browser',
    nameKey: 'rule.firefoxCache',
    pathTemplate: '~/Library/Caches/Firefox',
  },
  {
    id: 'arc-cache',
    category: 'browser',
    nameKey: 'rule.arcCache',
    pathTemplate: '~/Library/Caches/company.thebrowser.Browser',
  },
]

export function resolveRules(homePath: string): RuleDef[] {
  return rules.map((rule) => ({
    ...rule,
    pathTemplate: rule.pathTemplate.replace('~', homePath),
  }))
}

export const categories: { id: Category | 'all'; nameKey: string }[] = [
  { id: 'all', nameKey: 'category.all' },
  { id: 'system', nameKey: 'category.system' },
  { id: 'userCache', nameKey: 'category.userCache' },
  { id: 'systemLog', nameKey: 'category.systemLog' },
  { id: 'appCache', nameKey: 'category.appCache' },
  { id: 'browser', nameKey: 'category.browser' },
]
