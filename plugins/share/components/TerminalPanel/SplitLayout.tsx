import { Panel, Group, Separator } from 'react-resizable-panels'
import type { ILayoutNode } from '../../types/terminalLayout'
import type { TerminalPaneLayoutProps } from '../../lib/terminalPanel'
import TerminalPane from './TerminalPane'
import PaneHeader from './PaneHeader'

interface LayoutProps extends TerminalPaneLayoutProps {
  node: ILayoutNode
  showHeader: boolean
  paneIndex?: number
}

function LayoutNode({
  node,
  showHeader,
  paneIndex = 1,
  ...paneProps
}: LayoutProps) {
  if (node.type === 'leaf') {
    return (
      <div className="flex flex-col h-full">
        {showHeader && (
          <PaneHeader
            paneId={node.paneId}
            paneIndex={paneIndex}
            title={paneProps.paneTitles[node.paneId] ?? ''}
            isActive={paneProps.activePaneId === node.paneId}
            onSetActivePane={paneProps.onSetActivePane}
            onSplitPane={paneProps.onSplitPane}
            onClosePane={paneProps.onClosePane}
          />
        )}
        <div className="flex-1 overflow-hidden">
          <TerminalPane paneId={node.paneId} {...paneProps} />
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
          {...paneProps}
        />
      </Panel>
      <Separator />
      <Panel id={getLeafId(node.second)} minSize={50}>
        <LayoutNode
          node={node.second}
          showHeader={showHeader}
          paneIndex={paneIndex + countLeaves(node.first)}
          {...paneProps}
        />
      </Panel>
    </Group>
  )
}

function getLeafId(node: ILayoutNode): string {
  if (node.type === 'leaf') return node.paneId
  return getLeafId(node.first)
}

function countLeaves(node: ILayoutNode): number {
  if (node.type === 'leaf') return 1
  return countLeaves(node.first) + countLeaves(node.second)
}

interface SplitLayoutProps extends TerminalPaneLayoutProps {
  node: ILayoutNode
}

export default function SplitLayout({ node, ...paneProps }: SplitLayoutProps) {
  const hasSplits = node.type === 'split'

  return <LayoutNode node={node} showHeader={hasSplits} {...paneProps} />
}
