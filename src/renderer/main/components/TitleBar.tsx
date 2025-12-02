import { observer } from 'mobx-react-lite'
import Style from './Titlebar.module.scss'
import icon from '../../assets/icon.png'
import { t } from 'common/util'

export default observer(function Titlebar() {
  return (
    <div className={Style.container}>
      <div className={Style.icon}>
        <img src={icon} />
      </div>
      <input className={Style.input} placeholder={t('searchTool')} />
      <div className={Style.more}>
        <span className="icon-more" />
      </div>
    </div>
  )
})
