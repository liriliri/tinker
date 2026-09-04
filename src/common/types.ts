import { MenuItemConstructorOptions } from 'electron'
import types from 'licia/types'

export interface IMcpToolDefinition {
  description: string
  inputSchema?: Record<string, unknown>
}

export interface IPluginMcp {
  tools: Record<string, IMcpToolDefinition>
}

export type McpStdioServerConfig = {
  type?: 'stdio'
  command: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
}

export type McpHttpServerConfig = {
  type: 'http' | 'sse'
  url: string
  headers?: Record<string, string>
}

export type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig

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
  mcp?: IPluginMcp
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
  mcp?: IPluginMcp
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
  runAtStartup?: boolean
}

export type IPluginStates = Record<string, IPluginState>

export type IpcDragMain = (
  x: number,
  y: number,
  width: number,
  height: number
) => void
export type IpcGetPlugins = (force?: boolean) => Promise<IPlugin[]>
export type IpcHasPlugin = (id: string) => Promise<boolean>
export type IpcOpenPlugin = (id: string, detached?: boolean) => boolean
export type IpcClosePlugin = (id: string, destroy?: boolean) => void
export type IpcDetachPlugin = (id: string) => void
export interface IRunningPlugin {
  id: string
  background: boolean
}
export type IpcGetRunningPlugins = () => IRunningPlugin[]
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
export type IpcCreatePluginShortcut = (id: string) => Promise<string | void>
export type IpcGetClipboardFilePaths = () => string[]
export type IpcExportPluginData = (id: string) => void
export type IpcImportPluginData = IpcExportPluginData
export type IpcClearPluginData = IpcExportPluginData
export type IpcClearPluginCache = () => Promise<void>
export type IpcCaptureScreen = () => Promise<string>

export interface ICaptureSource {
  id: string
  name: string
  type: 'screen' | 'window'
  /** PNG data URL; sized to fit within 320×320, keeping source aspect ratio */
  thumbnail: string
  /** PNG data URL of the window app icon when available */
  appIcon: string
}

export interface IGetCaptureSourcesOptions {
  types?: Array<'screen' | 'window'>
}

export type IpcGetCaptureSources = (
  options?: IGetCaptureSourcesOptions
) => Promise<ICaptureSource[]>

export type IpcGetFileIcon = (filePath: string) => Promise<string>
export type IpcShowPluginNotification = (body: string) => void
export type IpcSetBackgroundThrottling = (allowed: boolean) => void
export type IpcCallMcpTool = (
  target: string | McpServerConfig,
  name: string,
  args?: Record<string, unknown>
) => Promise<string>
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

export type IpcPluginRecorderStarted = (pluginId: string) => Promise<void>
export type IpcPluginRecorderStopped = (pluginId: string) => Promise<void>
export type IpcPluginRecorderError = (
  pluginId: string,
  message: string
) => Promise<void>

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

export type IpcCreateTerminal = (
  sessionId: string,
  cols: number,
  rows: number,
  cwd?: string,
  shell?: string
) => void
export type IpcWriteTerminal = (sessionId: string, data: string) => void
export type IpcResizeTerminal = (
  sessionId: string,
  cols: number,
  rows: number
) => void
export type IpcDestroyTerminal = (sessionId: string) => void
export type IpcGetTerminalInfo = (
  sessionId: string
) => Promise<{ processName: string; cwd: string }>
