import { observer } from 'mobx-react-lite'
import store from '../store'
import LunaIconList from 'luna-icon-list/react'
import map from 'licia/map'
import fileUrl from 'licia/fileUrl'
import Style from './PluginList.module.scss'
import { borderRadius } from 'common/theme'

export default observer(function PluginList() {
  const icons = map(store.visiblePlugins, (plugin) => ({
    id: plugin.id,
    src: fileUrl(plugin.icon),
    name: plugin.name,
    style: {
      borderRadius: borderRadius + 'px',
    },
  }))

  return (
    <div className={Style.container}>
      <LunaIconList
        onClick={(e: any, icon) => {
          store.openPlugin((icon.data as any).id)
        }}
        onDoubleClick={(e: any, icon) => {
          store.openPlugin((icon.data as any).id, true)
        }}
        icons={icons}
        size={64}
      />
    </div>
  )
})
