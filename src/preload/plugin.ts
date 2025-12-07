import { contextBridge, ipcRenderer } from 'electron'
import mainObj from './main'
import { IPlugin } from 'common/types'
import { pathToFileURL } from 'url'

window.addEventListener('DOMContentLoaded', () => {
  updateTheme()
  mainObj.on('changeTheme', updateTheme)
})

mainObj.on('loadPluginPreload', loadPluginPreload)

async function loadPluginPreload(plugin: IPlugin) {
  if (plugin.preload) {
    await import(pathToFileURL(plugin.preload).href)
    ipcRenderer.emit('preloadReady')
  }
}

async function updateTheme() {
  const theme = await mainObj.getTheme()
  if (theme === 'dark') {
    document.body.classList.add('dark')
  } else {
    document.body.classList.remove('dark')
  }
}

const tinkerObj = {
  getTheme: mainObj.getTheme,
  getLanguage: mainObj.getLanguage,
  showOpenDialog: mainObj.showOpenDialog,
  showSaveDialog: mainObj.showSaveDialog,
  on: mainObj.on,
}

contextBridge.exposeInMainWorld('tinker', tinkerObj)

declare global {
  const tinker: typeof tinkerObj
}
