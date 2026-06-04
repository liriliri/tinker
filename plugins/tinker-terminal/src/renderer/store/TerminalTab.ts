import { makeAutoObservable } from 'mobx'
import uuid from 'licia/uuid'
import type { ILayoutNode, SplitDirection } from '../types'

class TerminalTab {
  id: string
  title: string
  layout: ILayoutNode

  constructor(id: string, title: string, paneId: string) {
    this.id = id
    this.title = title
    this.layout = { type: 'leaf', paneId }
    makeAutoObservable(this)
  }

  collectPaneIds(): string[] {
    return collectPaneIdsImpl(this.layout)
  }

  splitPane(
    targetPaneId: string,
    direction: SplitDirection,
    newPaneId: string
  ) {
    this.layout = splitNodeImpl(this.layout, targetPaneId, direction, newPaneId)
  }

  removePane(targetPaneId: string): boolean {
    const result = removePaneImpl(this.layout, targetPaneId)
    if (result) {
      this.layout = result
      return true
    }
    return false
  }

  static dualColumnsLayout(paneIds: string[]): ILayoutNode {
    return {
      type: 'split',
      direction: 'horizontal',
      firstSize: '50%',
      key: uuid(),
      first: { type: 'leaf', paneId: paneIds[0] },
      second: { type: 'leaf', paneId: paneIds[1] },
    }
  }

  static tripleColumnsLayout(paneIds: string[]): ILayoutNode {
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

  static gridLayout(paneIds: string[]): ILayoutNode {
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
}

function collectPaneIdsImpl(node: ILayoutNode): string[] {
  if (node.type === 'leaf') return [node.paneId]
  return [...collectPaneIdsImpl(node.first), ...collectPaneIdsImpl(node.second)]
}

function splitNodeImpl(
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
    first: splitNodeImpl(node.first, targetPaneId, direction, newPaneId),
    second: splitNodeImpl(node.second, targetPaneId, direction, newPaneId),
  }
}

function removePaneImpl(
  node: ILayoutNode,
  targetPaneId: string
): ILayoutNode | null {
  if (node.type === 'leaf') {
    return node.paneId === targetPaneId ? null : node
  }
  const first = removePaneImpl(node.first, targetPaneId)
  const second = removePaneImpl(node.second, targetPaneId)
  if (!first) return second
  if (!second) return first
  return { ...node, first, second }
}

export default TerminalTab
