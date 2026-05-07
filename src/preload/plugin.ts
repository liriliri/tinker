import { contextBridge } from 'electron'
import mainObj from './main'
import nodeObj from 'share/preload/node'
import {
  IpcCaptureScreen,
  IpcGetAttachedPlugin,
  IpcGetClipboardFilePaths,
  IpcGetFileIcon,
  IpcShowDevTools,
  IpcSendDebuggerCommand,
  IpcShowPluginNotification,
  IpcShowPluginContextMenu,
  IPlugin,
} from 'common/types'
import { pathToFileURL } from 'url'
import * as pluginRenderer from './pluginRenderer'
import { invoke } from 'share/preload/util'
import isStrBlank from 'licia/isStrBlank'
import { injectRendererScript, domReady } from './lib/util'
import { runFFmpeg, killFFmpeg, quitFFmpeg, getMediaInfo } from './lib/ffmpeg'
import { getDiskUsage, killDiskUsage, quitDiskUsage } from './lib/pdu'
import { saveData as saveDataUtil, loadData as loadDataUtil } from './lib/data'
import { callAI, callAIStream, abortAI, getProviderList } from './lib/ai/index'
import {
  startDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  deleteDownload,
  getDownloads,
  attachDownload,
} from './lib/download'
import types from 'licia/types'
import { i18n } from 'common/util'
import fs from 'node:fs'

window.addEventListener('DOMContentLoaded', () => {
  tinkerObj.setTitle('')
  updateTheme()
  mainObj.getLanguage().then((lang) => i18n.locale(lang))
  mainObj.on('changeTheme', updateTheme)
  mainObj.on('exportData', exportData)
  mainObj.on('importData', importData)
  mainObj.on('clearData', clearData)
})

function exportData() {
  injectRendererScript(
    `(${pluginRenderer.exportData.toString()})('${plugin?.id || ''}')`
  )
}

function importData() {
  injectRendererScript(`(${pluginRenderer.importData.toString()})()`)
}

function clearData() {
  injectRendererScript(`(${pluginRenderer.clearData.toString()})()`)
}

let plugin: IPlugin | null = null

async function preparePlugin(p: IPlugin) {
  plugin = p
  if (p.preload) {
    pluginRenderer.injectApi()
    await import(pathToFileURL(p.preload).href)
  }
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

function builtinOnly<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    if (!plugin?.builtin) return
    return fn(...args)
  }) as T
}

async function saveData(files: types.PlainObj<string | Uint8Array>) {
  return saveDataUtil(files, plugin)
}

async function loadData(): Promise<
  types.PlainObj<string | Uint8Array> | undefined
> {
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
  showNotification: invoke<IpcShowPluginNotification>('showPluginNotification'),
  showDevTools: invoke<IpcShowDevTools>('showDevTools'),
  sendDebuggerCommand: invoke<IpcSendDebuggerCommand>('sendDebuggerCommand'),
  setTitle,
  showItemInPath: mainObj.showItemInFolder,
  getAttachedPlugin: invoke<IpcGetAttachedPlugin>('getAttachedPlugin'),
  saveData,
  loadData,
  readFile: nodeObj.readFile,
  writeFile: nodeObj.writeFile,
  rm: fs.promises.rm,
  fstat: async (file: string) => {
    const stats = await fs.promises.stat(file)
    return {
      size: stats.size,
      mtime: stats.mtime,
      atime: stats.atime,
      ctime: stats.ctime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink(),
    }
  },
  getPath: mainObj.getPath,
  on: mainObj.on,
  runFFmpeg,
  killFFmpeg,
  quitFFmpeg,
  getMediaInfo,
  getDiskUsage,
  killDiskUsage,
  quitDiskUsage,
  startDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  deleteDownload,
  getDownloads,
  attachDownload,
  async getApps() {
    return await mainObj.getApps()
  },
  getSetting: builtinOnly(mainObj.getSettingsStore),
  setSetting: builtinOnly(mainObj.setSettingsStore),
  callAI,
  callAIStream,
  abortAI,
  getProviderList,
  t(key: string) {
    return i18n.t(key)
  },
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
