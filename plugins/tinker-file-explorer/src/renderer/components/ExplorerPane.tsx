import { observer } from 'mobx-react-lite'
import type ExplorerTab from '../store/ExplorerTab'
import ExplorerToolbar from './ExplorerToolbar'
import FileList from './FileList'

interface ExplorerPaneProps {
  tab: ExplorerTab
}

export default observer(function ExplorerPane({ tab }: ExplorerPaneProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <ExplorerToolbar tab={tab} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <FileList tab={tab} />
      </div>
    </div>
  )
})
