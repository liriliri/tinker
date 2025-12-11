import { contextBridge } from 'electron'
import mainObj from './main'
import {
  IpcGetAttachedPlugin,
  IpcShowPluginContextMenu,
  IPlugin,
} from 'common/types'
import { pathToFileURL } from 'url'
import pluginRenderer from './pluginRenderer'
import { invoke } from 'share/preload/util'

window.addEventListener('DOMContentLoaded', () => {
  updateTheme()
  mainObj.on('changeTheme', updateTheme)
})

function injectRendererScript() {
  const script = document.createElement('script')
  script.textContent = `(${pluginRenderer.toString()})()`
  document.documentElement.appendChild(script)
  document.documentElement.removeChild(script)
}

async function preparePlugin(plugin: IPlugin) {
  document.title = plugin.name
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
  showOpenDialog: mainObj.showOpenDialog,
  showSaveDialog: mainObj.showSaveDialog,
  showPluginContextMenu: invoke<IpcShowPluginContextMenu>(
    'showPluginContextMenu'
  ),
  getAttachedPlugin: invoke<IpcGetAttachedPlugin>('getAttachedPlugin'),
  on: mainObj.on,
}

contextBridge.exposeInMainWorld('_tinker', tinkerObj)
const observer = new MutationObserver(() => {
  if (document.documentElement) {
    observer.disconnect()
    injectRendererScript()
  }
})
observer.observe(document, { childList: true })
;(async function () {
  const plugin = await tinkerObj.getAttachedPlugin()
  if (plugin) {
    preparePlugin(plugin)
  }
})()

declare global {
  const _tinker: typeof tinkerObj
}
