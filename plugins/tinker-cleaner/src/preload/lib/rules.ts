import * as os from 'os'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import type { Category } from '../../common/types'

interface RuleDef {
  id: string
  category: Category
  nameKey: string
  pathTemplate: string
}

const macRules: RuleDef[] = [
  // System
  {
    id: 'sys-tmp',
    category: 'system',
    nameKey: 'ruleSysTmp',
    pathTemplate: '/private/tmp',
  },
  {
    id: 'sys-log',
    category: 'system',
    nameKey: 'ruleSysLog',
    pathTemplate: '/private/var/log',
  },
  {
    id: 'sys-diagnostics',
    category: 'system',
    nameKey: 'ruleSysDiagnostics',
    pathTemplate: '/private/var/db/diagnostics',
  },
  {
    id: 'sys-powerlog',
    category: 'system',
    nameKey: 'ruleSysPowerlog',
    pathTemplate: '/private/var/db/powerlog',
  },
  {
    id: 'sys-crash-reports',
    category: 'system',
    nameKey: 'ruleSysCrashReports',
    pathTemplate: '/Library/Logs/DiagnosticReports',
  },
  {
    id: 'sys-updates',
    category: 'system',
    nameKey: 'ruleSysUpdates',
    pathTemplate: '/Library/Updates',
  },

  // User cache
  {
    id: 'user-caches',
    category: 'userCache',
    nameKey: 'ruleUserCaches',
    pathTemplate: '~/Library/Caches',
  },
  {
    id: 'user-logs',
    category: 'userCache',
    nameKey: 'ruleUserLogs',
    pathTemplate: '~/Library/Logs',
  },
  {
    id: 'user-helpd',
    category: 'userCache',
    nameKey: 'ruleUserHelpd',
    pathTemplate: '~/Library/Caches/com.apple.helpd',
  },
  {
    id: 'user-geo',
    category: 'userCache',
    nameKey: 'ruleUserGeo',
    pathTemplate: '~/Library/Caches/GeoServices',
  },
  {
    id: 'sandbox-wallpaper',
    category: 'userCache',
    nameKey: 'ruleSandboxWallpaper',
    pathTemplate:
      '~/Library/Containers/com.apple.wallpaper.agent/Data/Library/Caches',
  },
  {
    id: 'sandbox-mediaanalysis',
    category: 'userCache',
    nameKey: 'ruleSandboxMediaAnalysis',
    pathTemplate:
      '~/Library/Containers/com.apple.mediaanalysisd/Data/Library/Caches',
  },
  {
    id: 'sandbox-appstore',
    category: 'userCache',
    nameKey: 'ruleSandboxAppStore',
    pathTemplate: '~/Library/Containers/com.apple.AppStore/Data/Library/Caches',
  },
  {
    id: 'xcode-doc-cache',
    category: 'userCache',
    nameKey: 'ruleXcodeDocCache',
    pathTemplate: '~/Library/Developer/Xcode/DocumentationCache',
  },

  // Dev tools
  {
    id: 'npm-cacache',
    category: 'devTools',
    nameKey: 'ruleNpmCacache',
    pathTemplate: '~/.npm/_cacache',
  },
  {
    id: 'npm-npx',
    category: 'devTools',
    nameKey: 'ruleNpmNpx',
    pathTemplate: '~/.npm/_npx',
  },
  {
    id: 'yarn-cache',
    category: 'devTools',
    nameKey: 'ruleYarnCache',
    pathTemplate: '~/Library/Caches/Yarn',
  },
  {
    id: 'bun-cache',
    category: 'devTools',
    nameKey: 'ruleBunCache',
    pathTemplate: '~/.bun/install/cache',
  },
  {
    id: 'pip-cache',
    category: 'devTools',
    nameKey: 'rulePipCache',
    pathTemplate: '~/Library/Caches/pip',
  },
  {
    id: 'cargo-registry',
    category: 'devTools',
    nameKey: 'ruleCargoRegistry',
    pathTemplate: '~/.cargo/registry/cache',
  },
  {
    id: 'gradle-caches',
    category: 'devTools',
    nameKey: 'ruleGradleCaches',
    pathTemplate: '~/.gradle/caches',
  },
  {
    id: 'huggingface',
    category: 'devTools',
    nameKey: 'ruleHuggingface',
    pathTemplate: '~/.cache/huggingface',
  },
  {
    id: 'homebrew',
    category: 'devTools',
    nameKey: 'ruleHomebrew',
    pathTemplate: '~/Library/Caches/Homebrew',
  },

  // App
  {
    id: 'vscode-cached-data',
    category: 'app',
    nameKey: 'ruleVscodeCachedData',
    pathTemplate: '~/Library/Application Support/Code/CachedData',
  },
  {
    id: 'vscode-cache',
    category: 'app',
    nameKey: 'ruleVscodeCache',
    pathTemplate: '~/Library/Application Support/Code/Cache',
  },
]

const winRules: RuleDef[] = [
  // System
  {
    id: 'win-tmp',
    category: 'system',
    nameKey: 'ruleSysTmp',
    pathTemplate: '%TEMP%',
  },
  {
    id: 'win-log',
    category: 'system',
    nameKey: 'ruleSysLog',
    pathTemplate: '%WINDIR%\\Logs',
  },

  // App
  {
    id: 'win-steam-htmlcache',
    category: 'app',
    nameKey: 'ruleSteamHtmlCache',
    pathTemplate: '%LOCALAPPDATA%\\Steam\\htmlcache\\Cache',
  },
  {
    id: 'win-steam-code-cache',
    category: 'app',
    nameKey: 'ruleSteamCodeCache',
    pathTemplate: '%LOCALAPPDATA%\\Steam\\htmlcache\\Code Cache',
  },

  // Dev tools
  {
    id: 'win-vscode-cache',
    category: 'devTools',
    nameKey: 'ruleVscodeCache',
    pathTemplate: '%APPDATA%\\Code\\Cache',
  },
  {
    id: 'win-vscode-cached-data',
    category: 'devTools',
    nameKey: 'ruleVscodeCachedData',
    pathTemplate: '%APPDATA%\\Code\\CachedData',
  },
]

export function resolveRules(): {
  id: string
  category: Category
  nameKey: string
  path: string
}[] {
  if (isWindows) {
    return winRules.map((rule) => ({
      id: rule.id,
      category: rule.category,
      nameKey: rule.nameKey,
      path: rule.pathTemplate.replace(
        /%([^%]+)%/g,
        (_, key: string) => process.env[key.toUpperCase()] || `%${key}%`
      ),
    }))
  }
  if (isMac) {
    const home = os.homedir()
    return macRules.map((rule) => ({
      id: rule.id,
      category: rule.category,
      nameKey: rule.nameKey,
      path: rule.pathTemplate.replace('~', home),
    }))
  }
  return []
}
