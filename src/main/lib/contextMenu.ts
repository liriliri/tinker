import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  WebContents,
} from 'electron'
import each from 'licia/each'

const contextMenu = function (
  webContents: WebContents,
  x: number,
  y: number,
  template: MenuItemConstructorOptions[],
  browserWindow?: BrowserWindow | null
) {
  x = Math.round(x)
  y = Math.round(y)

  transOptions(webContents, template)
  const menu = Menu.buildFromTemplate(template)
  menu.popup({
    window: browserWindow ?? undefined,
    x,
    y,
  })
}

export default contextMenu

function transOptions(
  webContents: WebContents,
  template: MenuItemConstructorOptions[]
) {
  each(template, (item: any) => {
    if (item.click) {
      const id: string = item.click
      item.click = function () {
        webContents.send('clickContextMenu', id)
      }
    }
    if (item.submenu) {
      item.submenu = transOptions(webContents, item.submenu)
    }
  })
  return template
}
