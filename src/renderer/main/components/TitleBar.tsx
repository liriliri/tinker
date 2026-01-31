import { observer } from 'mobx-react-lite'
import Style from './TitleBar.module.scss'
import logo from '../../assets/logo.png'
import { t } from 'common/util'
import { useCallback, useEffect, useRef } from 'react'
import store from '../store'
import fileUrl from 'licia/fileUrl'
import contextMenu from 'share/renderer/lib/contextMenu'

export default observer(function Titlebar() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const offShowWin = main.on('showWin', () => inputRef.current?.focus())
    const offPressEsc = main.on('pressEsc', () => {
      if (store.plugin) {
        store.closePlugin()
      } else {
        main.closeWin()
      }
    })
    return () => {
      offShowWin()
      offPressEsc()
    }
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const width = window.innerWidth
    const height = window.innerHeight

    const onMouseMove = () => {
      main.dragMain(e.clientX, e.clientY, width, height)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  let icon = logo
  if (store.plugin) {
    icon = fileUrl(store.plugin.icon)
  }

  function onMoreClick(e: React.MouseEvent) {
    const template: any[] = []

    if (store.plugin) {
      template.push(
        {
          label: t('detachWin'),
          click() {
            store.setFilter('')
            store.detachPlugin()
          },
        },
        {
          label: t('reopen'),
          click() {
            store.reopenPlugin()
          },
        },
        {
          label: t('toggleDevtools'),
          click() {
            store.togglePluginDevtools()
          },
        },
        {
          type: 'separator',
        }
      )

      if (!store.plugin.online) {
        template.push(
          {
            label: t('exportData'),
            click() {
              main.exportPluginData(store.plugin!.id)
            },
          },
          {
            label: t('importData'),
            click() {
              main.importPluginData(store.plugin!.id)
            },
          },
          {
            type: 'separator',
          }
        )
      }
    } else {
      template.push(
        {
          label: t('refresh'),
          click() {
            store.refresh(true)
          },
        },
        {
          type: 'separator',
        }
      )
    }

    template.push(
      {
        label: t('hide'),
        click() {
          main.hideWin()
        },
      },
      {
        label: t('close'),
        click() {
          main.closeWin()
        },
      }
    )

    contextMenu(e, template)
  }

  const onInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || store.plugin) {
        return
      }
      if (store.visiblePlugins.length > 0) {
        store.openPlugin(store.visiblePlugins[0].id)
      } else if (store.visibleApps.length > 0) {
        store.openApp(store.visibleApps[0].path)
      }
    },
    []
  )

  return (
    <div className={Style.container} onMouseDown={onMouseDown}>
      <div className={Style.icon}>
        <img src={icon} draggable={false} />
      </div>
      <div
        className={Style.inputContainer}
        onDoubleClick={() => main.toggleWinMaximize()}
      >
        <input
          className={Style.input}
          placeholder={t('searchTool')}
          autoFocus={true}
          value={store.filter}
          ref={inputRef}
          onKeyDown={onInputKeyDown}
          onChange={(e) => {
            if (store.plugin) {
              store.closePlugin()
            } else {
              store.setFilter(e.target.value)
            }
          }}
        />
        {store.plugin && (
          <span
            className="icon-close"
            onClick={() => {
              store.closePlugin()
              inputRef.current?.focus()
            }}
          />
        )}
      </div>
      <div className={Style.more} onClick={onMoreClick}>
        <span className="icon-more" />
      </div>
    </div>
  )
})
