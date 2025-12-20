import { MenuItemConstructorOptions } from 'electron'
import types from 'licia/types'

export interface IRawPlugin {
  name: string
  icon: string
  main: string
  preload?: string
  server?: boolean
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
  preload?: string
  icon: string
  main: string
  builtin: boolean
}

export type IpcDragMain = (x: number, y: number) => void
export type IpcGetPlugins = () => Promise<IPlugin[]>
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
