import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import store from '../store'
import Outline from './Outline'

export default observer(function Sidebar() {
  const isVisible = store.sidebarOpen && store.mindMap

  return (
    <div
      className={`
        w-56 h-full flex flex-col
        border-r ${tw.border.both}
        ${tw.bg.tertiary}
        transition-all duration-200
      `}
      style={{
        flexShrink: 0,
        marginLeft: isVisible ? 0 : -224,
      }}
    >
      <Outline />
    </div>
  )
})
