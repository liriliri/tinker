import types from 'licia/types'

export interface IPlugin {
  name: string
  description: string
  preload: string
  icon: string
  main: string
  locales?: types.PlainObj<{
    name?: string
    description?: string
  }>
}

export type IpcDragMain = (x: number, y: number) => void
export type IpcGetPlugins = () => Promise<IPlugin[]>
