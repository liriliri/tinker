import uuid from 'licia/uuid'
import type { IBaseTab } from 'share/components/TabBar'

export type SplitDirection = 'horizontal' | 'vertical'

interface ISplitNode {
  type: 'split'
  direction: SplitDirection
  first: ILayoutNode
  second: ILayoutNode
  firstSize?: string
  key?: string
}

interface ILeafNode {
  type: 'leaf'
  paneId: string
}

export type ILayoutNode = ISplitNode | ILeafNode

export interface ITerminalTab extends IBaseTab {
  id: string
  title: string
  layout: ILayoutNode
}

export function collectPaneIds(node: ILayoutNode): string[] {
  if (node.type === 'leaf') return [node.paneId]
  return [...collectPaneIds(node.first), ...collectPaneIds(node.second)]
}

export function splitNode(
  node: ILayoutNode,
  targetPaneId: string,
  direction: SplitDirection,
  newPaneId: string
): ILayoutNode {
  if (node.type === 'leaf') {
    if (node.paneId === targetPaneId) {
      return {
        type: 'split',
        direction,
        first: { type: 'leaf', paneId: targetPaneId },
        second: { type: 'leaf', paneId: newPaneId },
      }
    }
    return node
  }
  return {
    ...node,
    first: splitNode(node.first, targetPaneId, direction, newPaneId),
    second: splitNode(node.second, targetPaneId, direction, newPaneId),
  }
}

export function removePane(
  node: ILayoutNode,
  targetPaneId: string
): ILayoutNode | null {
  if (node.type === 'leaf') {
    return node.paneId === targetPaneId ? null : node
  }
  const first = removePane(node.first, targetPaneId)
  const second = removePane(node.second, targetPaneId)
  if (!first) return second
  if (!second) return first
  return { ...node, first, second }
}

export function dualColumnsLayout(paneIds: string[]): ILayoutNode {
  return {
    type: 'split',
    direction: 'horizontal',
    firstSize: '50%',
    key: uuid(),
    first: { type: 'leaf', paneId: paneIds[0] },
    second: { type: 'leaf', paneId: paneIds[1] },
  }
}

export function tripleColumnsLayout(paneIds: string[]): ILayoutNode {
  return {
    type: 'split',
    direction: 'horizontal',
    firstSize: '33%',
    key: uuid(),
    first: { type: 'leaf', paneId: paneIds[0] },
    second: {
      type: 'split',
      direction: 'horizontal',
      key: uuid(),
      first: { type: 'leaf', paneId: paneIds[1] },
      second: { type: 'leaf', paneId: paneIds[2] },
    },
  }
}

export function gridLayout(paneIds: string[]): ILayoutNode {
  return {
    type: 'split',
    direction: 'vertical',
    firstSize: '50%',
    key: uuid(),
    first: {
      type: 'split',
      direction: 'horizontal',
      firstSize: '50%',
      key: uuid(),
      first: { type: 'leaf', paneId: paneIds[0] },
      second: { type: 'leaf', paneId: paneIds[1] },
    },
    second: {
      type: 'split',
      direction: 'horizontal',
      firstSize: '50%',
      key: uuid(),
      first: { type: 'leaf', paneId: paneIds[2] },
      second: { type: 'leaf', paneId: paneIds[3] },
    },
  }
}
