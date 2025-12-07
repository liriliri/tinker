import { contextBridge } from 'electron'
import mainObj from './main'
import { IPlugin } from 'common/types'
import { pathToFileURL } from 'url'

window.addEventListener('DOMContentLoaded', () => {
  updateTheme()
  mainObj.on('loadPluginPreload', loadPluginPreload)
  mainObj.on('changeTheme', updateTheme)
})

async function loadPluginPreload(plugin: IPlugin) {
  if (plugin.preload) {
    await import(pathToFileURL(plugin.preload).href)
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
  on: mainObj.on,
}

contextBridge.exposeInMainWorld('tinker', tinkerObj)

declare global {
  const tinker: typeof tinkerObj
}
