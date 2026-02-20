import { contextBridge } from 'electron'
import mainObj from './main'
import nodeObj from 'share/preload/node'
import {
  IpcCaptureScreen,
  IpcGetAttachedPlugin,
  IpcGetClipboardFilePaths,
  IpcGetFileIcon,
  IpcShowPluginContextMenu,
  IPlugin,
} from 'common/types'
import { pathToFileURL } from 'url'
import * as pluginRenderer from './pluginRenderer'
import { invoke } from 'share/preload/util'
import isStrBlank from 'licia/isStrBlank'
import { injectRendererScript, domReady } from './lib/util'
import { runFFmpeg, killFFmpeg, quitFFmpeg, getMediaInfo } from './lib/ffmpeg'
import { saveData as saveDataUtil, loadData as loadDataUtil } from './lib/data'
import types from 'licia/types'
import { i18n } from 'common/util'

window.addEventListener('DOMContentLoaded', () => {
  tinkerObj.setTitle('')
  updateTheme()
  mainObj.getLanguage().then((lang) => i18n.locale(lang))
  mainObj.on('changeTheme', updateTheme)
  mainObj.on('exportData', exportData)
  mainObj.on('importData', importData)
})

function exportData() {
  injectRendererScript(
    `(${pluginRenderer.exportData.toString()})('${plugin?.id || ''}')`
  )
}

function importData() {
  injectRendererScript(`(${pluginRenderer.importData.toString()})()`)
}

let plugin: IPlugin | null = null

async function preparePlugin(p: IPlugin) {
  if (p.preload) {
    pluginRenderer.injectApi()
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

function setTitle(title: string) {
  if (plugin) {
    if (!isStrBlank(title)) {
      title = `${title} - ${plugin.name}`
    } else {
      title = plugin.name
    }
    document.title = title
  }
}

async function saveData(files: types.PlainObj<string>) {
  return saveDataUtil(files, plugin)
}

async function loadData(): Promise<types.PlainObj<string> | undefined> {
  return loadDataUtil(plugin)
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
  captureScreen: invoke<IpcCaptureScreen>('captureScreen'),
  getFileIcon: invoke<IpcGetFileIcon>('pluginGetFileIcon'),
  setTitle,
  showItemInPath: mainObj.showItemInFolder,
  getAttachedPlugin: invoke<IpcGetAttachedPlugin>('getAttachedPlugin'),
  saveData,
  loadData,
  readFile: nodeObj.readFile,
  writeFile: nodeObj.writeFile,
  tmpdir: nodeObj.tmpdir,
  on: mainObj.on,
  runFFmpeg,
  killFFmpeg,
  quitFFmpeg,
  getMediaInfo,
}

contextBridge.exposeInMainWorld('_tinker', tinkerObj)
window._tinker = tinkerObj

domReady(() => {
  injectRendererScript(`(${pluginRenderer.injectApi.toString()})()`)
})
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
