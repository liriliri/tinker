import {
  IpcClosePlugin,
  IpcDetachPlugin,
  IpcDragMain,
  IpcGetApps,
  IpcGetPlugins,
  IpcOpenApp,
  IpcOpenPlugin,
  IpcReopenPlugin,
  IpcTogglePluginDevtools,
} from 'common/types'
import mainObj from 'share/preload/main'
import { invoke } from 'share/preload/util'

export default Object.assign(mainObj, {
  dragMain: invoke<IpcDragMain>('dragMain'),
  getPlugins: invoke<IpcGetPlugins>('getPlugins'),
  openPlugin: invoke<IpcOpenPlugin>('openPlugin'),
  closePlugin: invoke<IpcClosePlugin>('closePlugin'),
  detachPlugin: invoke<IpcDetachPlugin>('detachPlugin'),
  reopenPlugin: invoke<IpcReopenPlugin>('reopenPlugin'),
  togglePluginDevtools: invoke<IpcTogglePluginDevtools>('togglePluginDevtools'),
  getApps: invoke<IpcGetApps>('getApps'),
  openApp: invoke<IpcOpenApp>('openApp'),
})
