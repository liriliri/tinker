import { IpcGetPlugins, IPlugin, IRawPlugin } from 'common/types'
import { handleEvent } from 'share/main/lib/util'
import singleton from 'licia/singleton'
import { isDev } from 'share/common/util'
import path from 'path'
import fs from 'fs-extra'
import startWith from 'licia/startWith'
import * as language from 'share/main/lib/language'
import extend from 'licia/extend'

let plugins: IPlugin[] | null = null
const getPlugins: IpcGetPlugins = singleton(async () => {
  if (!plugins) {
    plugins = []
    const pluginDir = path.join(
      __dirname,
      isDev() ? '../../plugins' : '../plugins'
    )
    const files = await fs.readdir(pluginDir, { withFileTypes: true })
    for (const file of files) {
      if (file.isDirectory() && startWith(file.name, 'tinker-')) {
        try {
          plugins.push(await getPlugin(path.join(pluginDir, file.name)))
        } catch {
          // ignore
        }
      }
    }
  }

  return plugins
})

async function getPlugin(dir: string): Promise<IPlugin> {
  const pkgPath = path.join(dir, 'package.json')
  const pkg = await fs.readJson(pkgPath)
  const rawPlugin = pkg.tinker as IRawPlugin
  const plugin: IPlugin = {
    id: pkg.name,
    name: rawPlugin.name,
    description: rawPlugin.description,
    icon: rawPlugin.icon,
    main: rawPlugin.main,
    preload: rawPlugin.preload,
  }
  plugin.icon = path.join(dir, plugin.icon)
  plugin.main = path.join(dir, plugin.main)
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

export function init() {
  handleEvent('getPlugins', getPlugins)
}
