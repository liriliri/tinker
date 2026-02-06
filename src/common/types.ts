import { MenuItemConstructorOptions } from 'electron'
import types from 'licia/types'

export interface IRawPlugin {
  name: string
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
  dir: string
  root: string
  historyApiFallback: boolean
  preload?: string
  icon: string
  main: string
  online: boolean
  builtin: boolean
}

export interface IApp {
  name: string
  icon: string
  path: string
}

export type IpcDragMain = (
  x: number,
  y: number,
  width: number,
  height: number
) => void
export type IpcGetPlugins = (force?: boolean) => Promise<IPlugin[]>
export type IpcOpenPlugin = (id: string, detached?: boolean) => boolean
export type IpcClosePlugin = (id: string) => void
export type IpcDetachPlugin = IpcClosePlugin
export type IpcReopenPlugin = IpcClosePlugin
export type IpcTogglePluginDevtools = IpcClosePlugin
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
export type IpcImportPluginData = (id: string) => void
export type IpcCaptureScreen = () => Promise<string>
