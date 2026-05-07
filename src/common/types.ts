import { MenuItemConstructorOptions } from 'electron'
import types from 'licia/types'

export interface IRawPlugin {
  name: string
  description?: string
  main: string
  icon?: string
  preload?: string
  server?: boolean
  historyApiFallback?: boolean
  locales?: types.PlainObj<{
    name?: string
    description?: string
  }>
}

export interface IPlugin {
  id: string
  name: string
  description: string
  dir: string
  root: string
  historyApiFallback: boolean
  preload?: string
  icon: string
  main: string
  online: boolean
  builtin: boolean
  marketplace?: boolean
  userInstalled?: boolean
  version?: string
}

export interface IApp {
  name: string
  icon: string
  path: string
}

export interface IPluginState {
  hidden?: boolean
  pinned?: boolean
  autoDetach?: boolean
  runInBackground?: boolean
}

export type IPluginStates = Record<string, IPluginState>

export type IpcDragMain = (
  x: number,
  y: number,
  width: number,
  height: number
) => void
export type IpcGetPlugins = (force?: boolean) => Promise<IPlugin[]>
export type IpcOpenPlugin = (id: string, detached?: boolean) => boolean
export type IpcClosePlugin = (id: string, destroy?: boolean) => void
export type IpcDetachPlugin = (id: string) => void
export type IpcIsPluginRunning = (
  id: string,
  backgroundOnly?: boolean
) => boolean
export type IpcReopenPlugin = IpcDetachPlugin
export type IpcTogglePluginDevtools = IpcDetachPlugin
export type IpcShowPluginContextMenu = (
  x: number,
  y: number,
  options: MenuItemConstructorOptions[]
) => void
export type IpcGetAttachedPlugin = () => Promise<IPlugin | undefined>
export type IpcGetApps = (force?: boolean) => Promise<IApp[]>
export type IpcOpenApp = (path: string) => void
export type IpcGetClipboardFilePaths = () => string[]
export type IpcExportPluginData = (id: string) => void
export type IpcImportPluginData = IpcExportPluginData
export type IpcClearPluginData = IpcExportPluginData
export type IpcCaptureScreen = () => Promise<string>
export type IpcGetFileIcon = (filePath: string) => Promise<string>
export type IpcShowPluginNotification = (body: string) => void
export type IpcInstallPlugin = (name: string) => Promise<void>
export type IpcUninstallPlugin = (name: string) => Promise<void>
export type IpcCheckPluginUpdate = (id: string) => Promise<string | null>
export type IpcShowDevTools = (
  srcWebContentsId: number,
  devtoolsWebContentsId: number
) => Promise<void>

export type IpcSendDebuggerCommand = (
  webContentsId: number,
  method: string,
  params?: Record<string, unknown>
) => Promise<unknown>

export interface IDownloadOptions {
  url: string
  savePath: string
}

export interface IDownloadProgress {
  state: string
  speed: number
  totalBytes: number
  receivedBytes: number
  paused: boolean
}

export type IpcStartPluginDownload = (
  downloadId: string,
  options: IDownloadOptions
) => Promise<void>
export type IpcPausePluginDownload = (downloadId: string) => void
export type IpcResumePluginDownload = (downloadId: string) => void
export type IpcCancelPluginDownload = (downloadId: string) => void
export type IpcGetPluginDownloads = () => Promise<IDownloadProgress[]>
