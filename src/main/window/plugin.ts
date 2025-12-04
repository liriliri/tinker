import { IPlugin } from 'common/types'
import { closePlugin, getAttachedPlugin, layoutPlugin } from '../lib/plugin'
import * as window from 'share/main/lib/window'

export function showWin(plugin: IPlugin) {
  const win = window.create({
    name: plugin.id,
  })
  win.setTitle(plugin.name)

  win.on('close', () => {
    if (win) {
      const plugin = getAttachedPlugin(win)
      if (plugin) {
        closePlugin(plugin.id)
      }
      win.destroy()
    }
  })

  win.on('resize', () => {
    if (win) {
      const plugin = getAttachedPlugin(win)
      if (plugin) {
        layoutPlugin(plugin.id)
      }
    }
  })

  window.loadPage(win, {
    page: 'plugin',
    title: plugin.name,
  })

  return win
}
