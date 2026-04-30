import { IpcGetPlugins, IPlugin, IRawPlugin } from 'common/types'
import { marketplacePlugins } from './marketplace'
import singleton from 'licia/singleton'
import { isDev } from 'share/common/util'
import path from 'path'
import fs from 'fs-extra'
import startWith from 'licia/startWith'
import * as language from 'share/main/lib/language'
import extend from 'licia/extend'
import types from 'licia/types'
import keys from 'licia/keys'
import map from 'licia/map'
import identity from 'licia/identity'
import replaceAll from 'licia/replaceAll'
import each from 'licia/each'
import { exec } from 'child_process'
import log from 'share/common/log'
import { resolveResources, getUserDataPath } from 'share/main/lib/util'

const logger = log('plugin')

const DEFAULT_ICON = resolveResources('default-plugin.png')

export const plugins: types.PlainObj<IPlugin> = {}

export async function loadSettingsPlugin() {
  const name = 'tinker-settings'
  plugins[name] = await loadPlugin(name, path.join(getBuiltinPluginDir(), name))
}

export function getBuiltinPluginDir() {
  return path.join(__dirname, isDev() ? '../../plugins' : '../plugins')
}

function normalizePluginId(id: string) {
  if (startWith(id, '@')) {
    return replaceAll(id.slice(1), '/', '-')
  }

  return id
}

async function getNpmGlobalDir(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('npm root -g', (error: Error | null, stdout: string) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

const userPluginDir = getUserDataPath('plugins')

async function loadPlugin(id: string, dir: string): Promise<IPlugin> {
  const builtinDir = getBuiltinPluginDir()
  const pkgPath = path.join(dir, 'package.json')
  const pkg = await fs.readJson(pkgPath)
  const rawPlugin = pkg.tinker as IRawPlugin
  const plugin: IPlugin = {
    id,
    dir,
    root: path.join(dir, path.dirname(rawPlugin.main)),
    name: rawPlugin.name,
    description: rawPlugin.description || pkg.description || '',
    icon: rawPlugin.icon || '',
    main: rawPlugin.main,
    historyApiFallback: rawPlugin.historyApiFallback || false,
    preload: rawPlugin.preload,
    online: startWith(rawPlugin.main, 'https://'),
    builtin: startWith(dir, builtinDir),
    userInstalled: startWith(dir, userPluginDir),
    version: pkg.version,
  }
  if (plugin.icon) {
    plugin.icon = path.join(dir, plugin.icon)
  } else {
    plugin.icon = DEFAULT_ICON
  }
  if (plugin.preload) {
    plugin.preload = path.join(dir, plugin.preload)
  }
  const lang = language.get()
  if (rawPlugin.locales) {
    const locale = rawPlugin.locales[lang]
    if (locale) {
      extend(plugin, locale)
    }
  }

  return plugin
}

function loadMarketplacePlugins(): IPlugin[] {
  const lang = language.get()
  const result: IPlugin[] = []

  for (const mp of marketplacePlugins) {
    if (plugins[mp.id]) continue

    let name = mp.name
    let description = mp.description
    if (mp.locales) {
      const locale = mp.locales[lang]
      if (locale) {
        if (locale.name) name = locale.name
        if (locale.description) description = locale.description
      }
    }

    result.push({
      id: mp.id,
      name,
      description,
      icon: resolveResources(`marketplace/${mp.icon}`),
      dir: '',
      root: '',
      main: '',
      online: false,
      builtin: false,
      historyApiFallback: false,
      marketplace: true,
    })
  }

  return result
}

export const getPlugins: IpcGetPlugins = singleton(async (force = false) => {
  if (!force && keys(plugins).length > 1) {
    return [...map(plugins, identity), ...loadMarketplacePlugins()]
  }

  const pluginDirs: Array<{ dir: string; prefix?: string }> = []
  if (keys(plugins).length <= 1) {
    pluginDirs.push({ dir: getBuiltinPluginDir() })
  }
  async function addNodeModulesDir(dir: string) {
    if (await fs.pathExists(dir)) {
      pluginDirs.push({ dir })
      const files = await fs.readdir(dir, { withFileTypes: true })
      for (const file of files) {
        if (startWith(file.name, '@') && file.isDirectory()) {
          pluginDirs.push({
            dir: path.join(dir, file.name),
            prefix: file.name + '/',
          })
        }
      }
    }
  }

  try {
    await addNodeModulesDir(await getNpmGlobalDir())
  } catch (e) {
    logger.warn('failed to get npm global directory:', e)
  }

  try {
    await addNodeModulesDir(getUserDataPath('plugins/node_modules'))
  } catch (e) {
    logger.warn('failed to read user plugin directory:', e)
  }

  each(plugins, (plugin) => {
    if (!plugin.builtin) {
      delete plugins[plugin.id]
    }
  })

  logger.info('loading plugins from directories:', pluginDirs)
  for (const { dir, prefix = '' } of pluginDirs) {
    const files = await fs.readdir(dir, { withFileTypes: true })
    for (const file of files) {
      if (startWith(file.name, 'tinker-')) {
        let isDir = file.isDirectory()
        if (file.isSymbolicLink()) {
          const fullPath = path.join(dir, file.name)
          try {
            const stat = await fs.stat(fullPath)
            isDir = stat.isDirectory()
          } catch (e) {
            logger.error(`failed to stat symlink ${file.name}:`, e)
            continue
          }
        }
        if (isDir) {
          try {
            const pluginDir = path.join(dir, file.name)
            const pkgPath = path.join(pluginDir, 'package.json')
            if (await fs.pathExists(pkgPath)) {
              const pkg = await fs.readJson(pkgPath)
              if (!pkg.tinker) {
                continue
              }
            } else {
              continue
            }
            const pluginId = normalizePluginId(prefix + file.name)
            if (!plugins[pluginId]) {
              plugins[pluginId] = await loadPlugin(pluginId, pluginDir)
            } else {
              logger.warn(`plugin conflict: ${pluginId}`)
            }
          } catch (e) {
            logger.error(`failed to load plugin ${file.name}:`, e)
          }
        }
      }
    }
  }

  return [...map(plugins, identity), ...loadMarketplacePlugins()]
})
