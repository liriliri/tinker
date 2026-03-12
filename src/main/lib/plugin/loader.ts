import { IpcGetPlugins, IPlugin, IRawPlugin } from 'common/types'
import singleton from 'licia/singleton'
import { isDev } from 'share/common/util'
import path from 'path'
import fs from 'fs-extra'
import startWith from 'licia/startWith'
import * as language from 'share/main/lib/language'
import extend from 'licia/extend'
import types from 'licia/types'
import isEmpty from 'licia/isEmpty'
import map from 'licia/map'
import identity from 'licia/identity'
import replaceAll from 'licia/replaceAll'
import each from 'licia/each'
import { exec } from 'child_process'
import log from 'share/common/log'
import { resolveResources } from 'share/main/lib/util'

const logger = log('plugin')

const DEFAULT_ICON = resolveResources('default-plugin.png')

export const plugins: types.PlainObj<IPlugin> = {}

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
    icon: rawPlugin.icon || '',
    main: rawPlugin.main,
    historyApiFallback: rawPlugin.historyApiFallback || false,
    preload: rawPlugin.preload,
    online: startWith(rawPlugin.main, 'https://'),
    builtin: startWith(dir, builtinDir),
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

export const getPlugins: IpcGetPlugins = singleton(async (force = false) => {
  if (!force && !isEmpty(plugins)) {
    return map(plugins, identity)
  }

  const pluginDirs: Array<{ dir: string; prefix?: string }> = []
  if (isEmpty(plugins)) {
    pluginDirs.push({ dir: getBuiltinPluginDir() })
  }
  try {
    const npmGlobalDir = await getNpmGlobalDir()
    pluginDirs.push({ dir: npmGlobalDir })
    const files = await fs.readdir(npmGlobalDir, { withFileTypes: true })
    for (const file of files) {
      if (startWith(file.name, '@') && file.isDirectory()) {
        pluginDirs.push({
          dir: path.join(npmGlobalDir, file.name),
          prefix: file.name + '/',
        })
      }
    }
  } catch (e) {
    logger.warn('failed to get npm global directory:', e)
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
            const pluginId = normalizePluginId(prefix + file.name)
            if (!plugins[pluginId]) {
              plugins[pluginId] = await loadPlugin(
                pluginId,
                path.join(dir, file.name)
              )
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

  return map(plugins, identity)
})
