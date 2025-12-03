import types from 'licia/types'

export interface IRawPlugin {
  name: string
  description: string
  icon: string
  main: string
  preload?: string
  locales?: types.PlainObj<{
    name?: string
    description?: string
  }>
}

export interface IPlugin {
  id: string
  name: string
  description: string
  preload?: string
  icon: string
  main: string
}

export type IpcDragMain = (x: number, y: number) => void
export type IpcGetPlugins = () => Promise<IPlugin[]>
