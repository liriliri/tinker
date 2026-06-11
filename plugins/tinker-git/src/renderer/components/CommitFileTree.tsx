import { observer } from 'mobx-react-lite'
import type {
  ITreeNode,
  IFileTreeDataSource,
} from 'share/components/FileTree/types'
import FileTree from 'share/components/FileTree'
import FileIcon from 'share/components/FileIcon'
import { tw } from 'share/theme'
import store from '../store'

const ICON_SIZE = 16

const commitDataSource: IFileTreeDataSource = {
  async readDir(path: string): Promise<ITreeNode[]> {
    const commit = store.selectedCommit
    if (!commit) return []
    try {
      return await git.getCommitTree(commit.sha, path)
    } catch {
      return []
    }
  },
}

export default observer(function CommitFileTree() {
  const commit = store.selectedCommit

  if (!commit) return null

  return (
    <div className={`h-full overflow-y-auto ${tw.bg.tertiary}`}>
      <FileTree
        nodes={store.treeNodes}
        dataSource={commitDataSource}
        iconSize={ICON_SIZE}
        onOpenFile={(path) => store.openFile(path)}
        renderIcon={(node) => {
          if (node.isDirectory) return null
          return (
            <FileIcon
              name={node.name}
              isDark={store.isDark}
              size={ICON_SIZE}
              className="ml-0.5 flex-shrink-0"
            />
          )
        }}
        activeFilePath={store.selectedFilePath}
      />
    </div>
  )
})
