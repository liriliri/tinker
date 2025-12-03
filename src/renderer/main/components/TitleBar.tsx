import { observer } from 'mobx-react-lite'
import Style from './Titlebar.module.scss'
import logo from '../../assets/logo.png'
import { t } from 'common/util'
import { useCallback } from 'react'
import store from '../store'

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

  return (
    <div className={Style.container} onMouseDown={onMouseDown}>
      <div className={Style.icon}>
        <img src={logo} draggable={false} />
      </div>
      <input
        className={Style.input}
        placeholder={t('searchTool')}
        autoFocus={true}
        value={store.filter}
        onChange={(e) => store.setFilter(e.target.value)}
      />
      <div className={Style.more}>
        <span className="icon-more" />
      </div>
    </div>
  )
})
