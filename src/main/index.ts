import { app, BrowserWindow, Menu } from 'electron'
import path from 'path'

class App {
  private win: BrowserWindow
  constructor() {
    this.win = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
      },
      maximizable: false,
      width: 800,
      height: 500,
    })

    this.init()
  }
  focus() {}
  private init() {
    this.initWin()
  }
  private initWin() {
    const { win } = this

    win.setMenu(
      Menu.buildFromTemplate([
        {
          label: 'Help',
          submenu: [
            {
              label: 'Toggle Developer Tools',
              click() {
                win.webContents.openDevTools()
              },
            },
          ],
        },
      ])
    )
    win.loadFile(path.resolve('file://', __dirname, '../../index.html'))
  }
}

const lock = app.requestSingleInstanceLock()

if (!lock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const app: App = (global as any).app
    if (app) {
      app.focus()
    }
  })
  app.on('ready', () => {
    ;(global as any).app = new App()
  })
}
