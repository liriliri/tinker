import { Menu, MenuItemConstructorOptions, WebContentsView } from 'electron'
import each from 'licia/each'

const contextMenu = function (
  view: WebContentsView,
  x: number,
  y: number,
  template: MenuItemConstructorOptions[]
) {
  x = Math.round(x)
  y = Math.round(y)

  transOptions(view, template)
  const menu = Menu.buildFromTemplate(template)
  menu.popup({
    x,
    y,
  })
}

export default contextMenu

function transOptions(
  view: WebContentsView,
  template: MenuItemConstructorOptions[]
) {
  each(template, (item: any) => {
    if (item.click) {
      const id: string = item.click
      item.click = function () {
        view.webContents.send('clickContextMenu', id)
      }
    }
    if (item.submenu) {
      item.submenu = transOptions(view, item.submenu)
    }
  })
  return template
}
