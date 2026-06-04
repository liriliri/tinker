import { observer } from 'mobx-react-lite'
import { FileText } from 'lucide-react'
import type {
  ITreeNode,
  IFileTreeDataSource,
} from 'share/components/FileTree/types'
import FileTree from 'share/components/FileTree'
import { tw } from 'share/theme'
import store from '../store'

const commitDataSource: IFileTreeDataSource = {
  async readDir(path: string): Promise<ITreeNode[]> {
    const commit = store.selectedCommit
    console.log('[CommitFileTree] readDir called:', {
      path,
      hasCommit: !!commit,
      sha: commit?.sha,
    })
    if (!commit) {
      console.warn('[CommitFileTree] readDir: no selected commit')
      return []
    }
    try {
      const result = await git.getCommitTree(commit.sha, path)
      console.log('[CommitFileTree] readDir result:', {
        path,
        count: result.length,
        items: result.map((r) => ({
          name: r.name,
          isDirectory: r.isDirectory,
        })),
      })
      return result
    } catch (err) {
      console.error('[CommitFileTree] readDir error:', err)
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
        onOpenFile={(path) => store.openFile(path)}
        renderIcon={(node) => {
          if (node.isDirectory) return null
          return (
            <FileText
              size={14}
              className={`${tw.text.tertiary} flex-shrink-0 ml-0.5`}
            />
          )
        }}
      />
    </div>
  )
})
