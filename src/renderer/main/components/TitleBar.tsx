import { observer } from 'mobx-react-lite'
import Style from './Titlebar.module.scss'
import icon from '../../assets/icon.png'
import { t } from 'common/util'
import { useCallback, useRef } from 'react'

export default observer(function Titlebar() {
  const inputRef = useRef<HTMLInputElement>(null)

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
        <img src={icon} draggable={false} />
      </div>
      <input
        className={Style.input}
        ref={inputRef}
        placeholder={t('searchTool')}
      />
      <div className={Style.more}>
        <span className="icon-more" />
      </div>
    </div>
  )
})
