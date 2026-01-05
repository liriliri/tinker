import { contextBridge } from 'electron'
import mainObj from './main'
import {
  IpcGetAttachedPlugin,
  IpcGetClipboardFilePaths,
  IpcShowPluginContextMenu,
  IPlugin,
} from 'common/types'
import { pathToFileURL } from 'url'
import * as pluginRenderer from './pluginRenderer'
import { invoke } from 'share/preload/util'
import isStrBlank from 'licia/isStrBlank'
import {
  injectRendererScript,
  domReady,
  zipFiles,
  unzipFiles,
} from './lib/util'
import types from 'licia/types'
import fs from 'fs-extra'
import dateFormat from 'licia/dateFormat'

window.addEventListener('DOMContentLoaded', () => {
  tinkerObj.setTitle('')
  updateTheme()
  mainObj.on('changeTheme', updateTheme)
  mainObj.on('exportData', exportData)
  mainObj.on('importData', importData)
})

function exportData() {
  injectRendererScript(`(${pluginRenderer.exportData.toString()})()`)
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
  const buf = zipFiles(files)
  const { filePath } = await mainObj.showSaveDialog({
    title: 'Export Data',
    defaultPath: plugin
      ? `${plugin.id}-${dateFormat('yyyymmdd')}.zip`
      : 'tinker-data.zip',
    filters: [{ name: 'Zip Files', extensions: ['zip'] }],
  })
  if (filePath) {
    await fs.writeFile(filePath, buf)
  }
}

async function loadData(): Promise<types.PlainObj<string> | undefined> {
  const { filePaths } = await mainObj.showOpenDialog({
    title: 'Import Data',
    properties: ['openFile'],
    filters: [{ name: 'Zip Files', extensions: ['zip'] }],
  })
  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0]
    const buf = await fs.readFile(filePath)
    const files = unzipFiles(buf)
    return files
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
  setTitle,
  showItemInPath: mainObj.showItemInFolder,
  getAttachedPlugin: invoke<IpcGetAttachedPlugin>('getAttachedPlugin'),
  saveData,
  loadData,
  on: mainObj.on,
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
