import { observer } from 'mobx-react-lite'
import store from '../store'
import LunaIconList from 'luna-icon-list/react'
import map from 'licia/map'
import fileUrl from 'licia/fileUrl'
import Style from './PluginList.module.scss'
import { borderRadius } from 'common/theme'
import { IPlugin } from 'common/types'
import contextMenu from 'share/renderer/lib/contextMenu'
import { t } from 'common/util'

export default observer(function PluginList() {
  const icons = map(store.visiblePlugins, (plugin) => ({
    plugin,
    src: fileUrl(plugin.icon),
    name: plugin.name,
    style: {
      borderRadius: borderRadius + 'px',
    },
  }))

  function onContextMenu(e: PointerEvent, plugin: IPlugin) {
    const template: any[] = [
      {
        label: t('open'),
        click() {
          store.openPlugin(plugin.id)
        },
      },
      {
        label: t('openInNewWin'),
        click() {
          store.openPlugin(plugin.id, true)
        },
      },
    ]

    contextMenu(e, template)
  }

  return (
    <div className={Style.container}>
      <LunaIconList
        onClick={(e: any, icon) => {
          store.openPlugin((icon.data as any).plugin.id)
        }}
        onDoubleClick={(e: any, icon) => {
          store.openPlugin((icon.data as any).plugin.id, true)
        }}
        onContextMenu={(e: any, icon) => {
          onContextMenu(e, (icon.data as any).plugin)
        }}
        icons={icons}
        size={64}
      />
    </div>
  )
})
