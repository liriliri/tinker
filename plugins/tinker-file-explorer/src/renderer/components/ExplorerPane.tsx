import { observer } from 'mobx-react-lite'
import FilePreview from 'share/components/FilePreview'
import type Explorer from '../store/Explorer'
import ExplorerToolbar from './ExplorerToolbar'
import FileList from './FileList'
import FileGrid from './FileGrid'
import store from '../store'

interface ExplorerPaneProps {
  tab: Explorer
}

export default observer(function ExplorerPane({ tab }: ExplorerPaneProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <ExplorerToolbar tab={tab} />
      <div className="flex-1 min-h-0 overflow-hidden flex">
        <div className="flex-1 min-h-0 overflow-hidden">
          {store.viewMode === 'list' ? (
            <FileList tab={tab} />
          ) : (
            <FileGrid tab={tab} />
          )}
        </div>
        {store.showPreview && <FilePreview path={tab.previewPath} />}
      </div>
    </div>
  )
})
