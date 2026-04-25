import { observer } from 'mobx-react-lite'
import store from '../store'
import LunaIconList from 'luna-icon-list/react'
import LunaScrollbar from 'luna-scrollbar/react'
import map from 'licia/map'
import fileUrl from 'licia/fileUrl'
import Style from './PluginList.module.scss'
import { borderRadius } from 'common/theme'
import contextMenu from 'share/renderer/lib/contextMenu'
import LunaModal from 'luna-modal'
import { t } from 'common/util'
import concat from 'licia/concat'
import isEmpty from 'licia/isEmpty'
import { IPlugin } from 'common/types'

export default observer(function PluginList() {
  const pluginIcons = map(store.visiblePlugins, (plugin) => ({
    plugin,
    src: fileUrl(plugin.icon),
    name: plugin.name,
    title: plugin.description,
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

  async function onContextMenu(e: PointerEvent, data: any) {
    const template: any[] = []

    if (data.plugin) {
      const plugin: IPlugin = data.plugin
      const autoDetach = store.isPluginAutoDetach(plugin.id)
      const runInBackground = store.isPluginRunInBackground(plugin.id)
      const running = await main.isPluginRunning(plugin.id)
      template.push({
        label: t('open'),
        click() {
          store.openPlugin(plugin.id, autoDetach)
        },
      })
      if (!autoDetach) {
        template.push({
          label: t('openInNewWin'),
          click() {
            store.openPlugin(plugin.id, true)
          },
        })
      }
      if (running) {
        template.push({
          label: t('close'),
          click() {
            main.closePlugin(plugin.id, true)
          },
        })
      }
      if (!plugin.builtin) {
        template.push({
          label: t('openDir'),
          click() {
            main.openPath(plugin.dir)
          },
        })
      }
      template.push({ type: 'separator' })
      if (store.isPluginPinned(plugin.id)) {
        template.push({
          label: t('unpin'),
          click() {
            store.unpinPlugin(plugin.id)
          },
        })
      } else {
        template.push({
          label: t('pin'),
          click() {
            store.pinPlugin(plugin.id)
          },
        })
      }
      if (store.isPluginHidden(plugin.id)) {
        template.push({
          label: t('unhide'),
          click() {
            store.unhidePlugin(plugin.id)
          },
        })
      } else {
        template.push({
          label: t('hide'),
          async click() {
            const result = await LunaModal.confirm(t('hideConfirm'))
            if (result) {
              store.hidePlugin(plugin.id)
            }
          },
        })
      }
      template.push({ type: 'separator' })
      template.push({
        label: t('autoDetach'),
        type: 'checkbox',
        checked: autoDetach,
        click() {
          if (autoDetach) {
            store.unsetPluginAutoDetach(plugin.id)
          } else {
            store.setPluginAutoDetach(plugin.id)
          }
        },
      })
      template.push({
        label: t('runInBackground'),
        type: 'checkbox',
        checked: runInBackground,
        click() {
          if (runInBackground) {
            store.unsetPluginRunInBackground(plugin.id)
          } else {
            store.setPluginRunInBackground(plugin.id)
          }
        },
      })
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
              store.openPlugin(
                data.plugin.id,
                store.isPluginAutoDetach(data.plugin.id)
              )
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
