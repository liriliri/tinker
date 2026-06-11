import { observer } from 'mobx-react-lite'
import { Panel, Group, Separator } from 'react-resizable-panels'
import type { ILayoutNode } from '../../types/terminalLayout'
import TerminalPane from './TerminalPane'
import PaneHeader from './PaneHeader'

interface LayoutProps {
  node: ILayoutNode
  showHeader: boolean
  paneIndex?: number
}

const LayoutNode = observer(function LayoutNode({
  node,
  showHeader,
  paneIndex = 1,
}: LayoutProps) {
  if (node.type === 'leaf') {
    return (
      <div className="flex flex-col h-full">
        {showHeader && (
          <PaneHeader paneId={node.paneId} paneIndex={paneIndex} />
        )}
        <div className="flex-1 overflow-hidden">
          <TerminalPane paneId={node.paneId} />
        </div>
      </div>
    )
  }

  const orientation =
    node.direction === 'horizontal' ? 'horizontal' : 'vertical'

  return (
    <Group key={node.key} orientation={orientation} className="h-full">
      <Panel
        id={getLeafId(node.first)}
        minSize={50}
        defaultSize={node.firstSize}
      >
        <LayoutNode
          node={node.first}
          showHeader={showHeader}
          paneIndex={paneIndex}
        />
      </Panel>
      <Separator />
      <Panel id={getLeafId(node.second)} minSize={50}>
        <LayoutNode
          node={node.second}
          showHeader={showHeader}
          paneIndex={paneIndex + countLeaves(node.first)}
        />
      </Panel>
    </Group>
  )
})

function getLeafId(node: ILayoutNode): string {
  if (node.type === 'leaf') return node.paneId
  return getLeafId(node.first)
}

function countLeaves(node: ILayoutNode): number {
  if (node.type === 'leaf') return 1
  return countLeaves(node.first) + countLeaves(node.second)
}

interface SplitLayoutProps {
  node: ILayoutNode
}

export default observer(function SplitLayout({ node }: SplitLayoutProps) {
  const hasSplits = node.type === 'split'

  return <LayoutNode node={node} showHeader={hasSplits} />
})
