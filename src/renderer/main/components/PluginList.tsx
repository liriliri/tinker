import { observer } from 'mobx-react-lite'
import store from '../store'
import LunaIconList from 'luna-icon-list/react'
import map from 'licia/map'
import fileUrl from 'licia/fileUrl'
import Style from './PluginList.module.scss'
import { borderRadius } from 'common/theme'
import contextMenu from 'share/renderer/lib/contextMenu'
import { t } from 'common/util'
import concat from 'licia/concat'
import isEmpty from 'licia/isEmpty'

export default observer(function PluginList() {
  const pluginIcons = map(store.visiblePlugins, (plugin) => ({
    plugin,
    src: fileUrl(plugin.icon),
    name: plugin.name,
    style: {
      borderRadius: borderRadius + 'px',
    },
  }))
  const appIcons = map(store.visibleApps, (app) => ({
    app,
    src: fileUrl(app.icon),
    name: app.name,
    style: {
      borderRadius: borderRadius + 'px',
    },
  }))
  const icons = concat(pluginIcons, appIcons)

  function onContextMenu(e: PointerEvent, data: any) {
    const template: any[] = []

    if (data.plugin) {
      template.push(
        {
          label: t('open'),
          click() {
            store.openPlugin(data.plugin.id)
          },
        },
        {
          label: t('openInNewWin'),
          click() {
            store.openPlugin(data.plugin.id, true)
          },
        }
      )
    } else {
      template.push({
        label: t('open'),
        click() {
          store.openApp(data.app.path)
        },
      })
    }

    contextMenu(e, template)
  }

  return (
    <div className={Style.container}>
      {isEmpty(icons) && store.filter ? (
        <div className={Style.noResult}>{t('noResult')}</div>
      ) : null}
      <LunaIconList
        onClick={(e: any, icon) => {
          const data = icon.data as any
          if (data.plugin) {
            store.openPlugin(data.plugin.id)
          } else {
            store.openApp(data.app.path)
          }
        }}
        onDoubleClick={(e: any, icon) => {
          const data = icon.data as any
          if (data.plugin) {
            store.openPlugin(data.plugin.id, true)
          } else {
            store.openApp(data.app.path)
          }
        }}
        onContextMenu={(e: any, icon) => {
          onContextMenu(e, icon.data)
        }}
        icons={icons}
        size={64}
      />
    </div>
  )
})
