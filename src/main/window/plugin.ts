import { IPlugin } from 'common/types'
import { closePlugin, getAttachedPlugin, layoutPlugin } from '../lib/plugin'
import * as window from 'share/main/lib/window'
import * as dock from '../lib/dock'

export function showWin(plugin: IPlugin) {
  const win = window.create({
    name: plugin.id,
  })

  win.on('close', () => {
    if (win) {
      const plugin = getAttachedPlugin(win)
      if (plugin) {
        closePlugin(plugin.id)
      }
      win.destroy()
    }
    dock.hide()
  })

  function onLayout() {
    if (win) {
      const plugin = getAttachedPlugin(win)
      if (plugin) {
        layoutPlugin(plugin.id)
      }
    }
  }

  win.on('resize', onLayout)
  win.on('enter-full-screen', onLayout)
  win.on('leave-full-screen', onLayout)

  dock.show()

  window.loadPage(win, {
    page: 'plugin',
  })

  return win
}
