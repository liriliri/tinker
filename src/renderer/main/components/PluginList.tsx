import { observer } from 'mobx-react-lite'
import store from '../store'
import LunaIconList from 'luna-icon-list/react'
import LunaScrollbar from 'luna-scrollbar/react'
import map from 'licia/map'
import fileUrl from 'licia/fileUrl'
import Style from './PluginList.module.scss'
import { borderRadius } from 'common/theme'
import contextMenu from 'share/renderer/lib/contextMenu'
import { t } from 'common/util'
import concat from 'licia/concat'
import isEmpty from 'licia/isEmpty'
import { IPlugin } from 'common/types'

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
      const plugin: IPlugin = data.plugin
      template.push(
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
        }
      )
      if (!plugin.builtin) {
        template.push({
          label: t('openDir'),
          click() {
            main.openPath(plugin.dir)
          },
        })
      }
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
      <LunaScrollbar className={Style.scrollbar}>
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
          size={48}
        />
      </LunaScrollbar>
    </div>
  )
})
