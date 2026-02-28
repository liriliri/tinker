import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Tree, { TreeNodeData } from 'share/components/Tree'
import type { MindMapNode } from '../types'
import store from '../store'

interface OutlineNode extends TreeNodeData {
  children?: OutlineNode[]
  isRoot?: boolean
}

export default observer(function Outline() {
  const { t } = useTranslation()
  const [outlineData, setOutlineData] = useState<OutlineNode | null>(null)
  const [activeNodeUid, setActiveNodeUid] = useState<string | null>(null)

  useEffect(() => {
    if (!store.mindMap) return

    const transformNode = (node: MindMapNode): OutlineNode => {
      return {
        id: node.data.uid as string,
        label: (node.data.text as string) || '',
        children: node.children ? node.children.map(transformNode) : [],
        isRoot: node.isRoot,
      }
    }

    const updateOutline = () => {
      const data = store.mindMap?.getData(true)
      if (data && data.root) {
        const transformedData = transformNode(data.root as MindMapNode)
        setOutlineData(transformedData)
      }
    }

    updateOutline()

    const handleDataChange = () => {
      updateOutline()
    }

    const handleNodeActive = (_node: unknown, nodeList: MindMapNode[]) => {
      if (nodeList.length > 0) {
        setActiveNodeUid(nodeList[0].getData('uid') as string)
      } else {
        setActiveNodeUid(null)
      }
    }

    store.mindMap.on('data_change', handleDataChange)
    store.mindMap.on('node_active', handleNodeActive)

    return () => {
      store.mindMap?.off('data_change', handleDataChange)
      store.mindMap?.off('node_active', handleNodeActive)
    }
  }, [store.mindMap])

  const handleNodeClick = (node: OutlineNode) => {
    if (!store.mindMap) return
    store.mindMap.execCommand('GO_TARGET_NODE', node.id)
  }

  if (!store.mindMap) {
    return null
  }

  return (
    <Tree
      data={outlineData}
      onNodeClick={handleNodeClick}
      activeNodeId={activeNodeUid}
      emptyText={t('outlineNoData')}
    />
  )
})
