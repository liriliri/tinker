export interface IPlugin {
  name: string
  description: string
  icon: string
  main: string
}

export type IpcDragMain = (x: number, y: number) => void
export type IpcGetPlugins = () => Promise<IPlugin[]>
