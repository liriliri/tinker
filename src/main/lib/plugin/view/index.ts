export { PLUGIN_PARTITION, pluginViews } from './state'
export { preparePluginView } from './create'
export {
  openPlugin,
  startBackgroundPlugins,
  reopenPlugin,
  updatePluginTheme,
  closePlugin,
  getRunningPlugins,
  startPluginInspectForRunning,
  isPluginRunning,
  detachPlugin,
  getAttachedPlugin,
  getWebContentsPlugin,
  layoutPlugin,
} from './lifecycle'
export {
  callPluginMcpTool,
  callMcpTool,
  togglePluginDevtools,
  showPluginContextMenu,
  exportPluginData,
  importPluginData,
  clearPluginData,
  evalPluginRenderer,
} from './bridge'
