import { contextBridge } from 'electron'
import mainObj from './main'
import {
  IpcGetAttachedPlugin,
  IpcGetClipboardFilePaths,
  IpcShowPluginContextMenu,
  IPlugin,
} from 'common/types'
import { pathToFileURL } from 'url'
import pluginRenderer from './pluginRenderer'
import { invoke } from 'share/preload/util'
import isStrBlank from 'licia/isStrBlank'

window.addEventListener('DOMContentLoaded', () => {
  tinkerObj.setTitle('')
  updateTheme()
  mainObj.on('changeTheme', updateTheme)
})

function injectRendererScript() {
  const script = document.createElement('script')
  script.textContent = `(${pluginRenderer.toString()})()`
  document.documentElement.appendChild(script)
  document.documentElement.removeChild(script)
}

let plugin: IPlugin | null = null

async function preparePlugin(p: IPlugin) {
  if (p.preload) {
    pluginRenderer()
    await import(pathToFileURL(p.preload).href)
  }
  plugin = p
}

async function updateTheme() {
  const theme = await mainObj.getTheme()
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
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
  getClipboardFilePaths: invoke<IpcGetClipboardFilePaths>(
    'getClipboardFilePaths'
  ),
  setTitle: (title: string) => {
    if (plugin) {
      if (!isStrBlank(title)) {
        title = `${title} - ${plugin.name}`
      } else {
        title = plugin.name
      }
      document.title = title
    }
  },
  showItemInPath: mainObj.showItemInFolder,
  getAttachedPlugin: invoke<IpcGetAttachedPlugin>('getAttachedPlugin'),
  on: mainObj.on,
}

contextBridge.exposeInMainWorld('_tinker', tinkerObj)
window._tinker = tinkerObj

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
  interface Window {
    _tinker: typeof tinkerObj
  }
  const _tinker: typeof tinkerObj
}
