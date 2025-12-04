import { observer } from 'mobx-react-lite'
import Style from './Titlebar.module.scss'
import logo from '../../assets/logo.png'
import { t } from 'common/util'
import { useCallback } from 'react'
import store from '../store'
import fileUrl from 'licia/fileUrl'
import contextMenu from 'share/renderer/lib/contextMenu'

export default observer(function Titlebar() {
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const onMouseMove = () => {
      main.dragMain(e.clientX, e.clientY)
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
          type: 'separator',
        }
      )
    }

    template.push({
      label: t('close'),
      click() {
        main.closeWin()
      },
    })

    contextMenu(e, template)
  }

  return (
    <div className={Style.container} onMouseDown={onMouseDown}>
      <div className={Style.icon}>
        <img src={icon} draggable={false} />
      </div>
      <input
        className={Style.input}
        placeholder={t('searchTool')}
        autoFocus={true}
        value={store.filter}
        onChange={(e) => {
          if (store.plugin) {
            store.closePlugin()
            store.setFilter('')
          } else {
            store.setFilter(e.target.value)
          }
        }}
        onDoubleClick={() => main.toggleWinMaximize()}
      />
      <div className={Style.more} onClick={onMoreClick}>
        <span className="icon-more" />
      </div>
    </div>
  )
})
