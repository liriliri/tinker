import { observer } from 'mobx-react-lite'
import Style from './Titlebar.module.scss'

export default observer(function Titlebar() {
  return <div className={Style.container}>
    <div></div>
    <input/>
    <div></div>
  </div>
})
