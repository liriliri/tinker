import { MenuItemConstructorOptions } from 'electron'
import types from 'licia/types'

declare const window: any

export default function () {
  window.tinker = {
    ..._tinker,
    showContextMenu,
  }

  function showContextMenu(x, y, options) {
    callbacks = {}
    transOptions(options)

    _tinker.showPluginContextMenu(x, y, options)
  }

  let callbacks: types.PlainObj<types.AnyFn> = {}

  function transOptions(options: MenuItemConstructorOptions[]) {
    options = Array.isArray(options) ? options : [options]
    options.forEach((item) => {
      if (typeof item.click === 'function') {
        const id = uuid()
        callbacks[id] = item.click
        ;(item as any).click = id
      }
      if (item.submenu) {
        item.submenu = transOptions(
          item.submenu as MenuItemConstructorOptions[]
        )
      }
    })
    return options
  }

  _tinker.on('clickContextMenu', (id: string) => {
    if (callbacks[id]) {
      callbacks[id]()
    }
  })

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      }
    )
  }
}
