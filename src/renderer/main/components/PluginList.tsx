import { observer } from 'mobx-react-lite'
import store from '../store'
import LunaIconList from 'luna-icon-list/react'
import map from 'licia/map'
import fileUrl from 'licia/fileUrl'
import Style from './Plugin.module.scss'

export default observer(function PluginList() {
  const icons = map(store.plugins, (plugin) => ({
    src: fileUrl(plugin.icon),
    name: plugin.name,
  }))

  return (
    <div className={Style.container}>
      <LunaIconList icons={icons} size={48} />
    </div>
  )
})
