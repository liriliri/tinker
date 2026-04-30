import {
  IpcClosePlugin,
  IpcDetachPlugin,
  IpcDragMain,
  IpcExportPluginData,
  IpcGetApps,
  IpcGetPlugins,
  IpcImportPluginData,
  IpcClearPluginData,
  IpcInstallPlugin,
  IpcUninstallPlugin,
  IpcIsPluginRunning,
  IpcOpenApp,
  IpcOpenPlugin,
  IpcReopenPlugin,
  IpcTogglePluginDevtools,
} from 'common/types'
import { IpcGetStore, IpcSetStore } from 'share/common/types'
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
  exportPluginData: invoke<IpcExportPluginData>('exportPluginData'),
  importPluginData: invoke<IpcImportPluginData>('importPluginData'),
  clearPluginData: invoke<IpcClearPluginData>('clearPluginData'),
  preparePluginView: invoke('preparePluginView'),
  isPluginRunning: invoke<IpcIsPluginRunning>('isPluginRunning'),
  installPlugin: invoke<IpcInstallPlugin>('installPlugin'),
  uninstallPlugin: invoke<IpcUninstallPlugin>('uninstallPlugin'),
  getMainStore: invoke<IpcGetStore>('getMainStore'),
  setMainStore: invoke<IpcSetStore>('setMainStore'),
})
