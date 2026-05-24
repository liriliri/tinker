import { makeAutoObservable } from 'mobx'
import uuid from 'licia/uuid'
import BaseStore from 'share/BaseStore'
import type { IBaseTab } from 'share/components/TabBar'

export type SplitDirection = 'horizontal' | 'vertical'

export interface ISplitNode {
  type: 'split'
  direction: SplitDirection
  first: ILayoutNode
  second: ILayoutNode
}

export interface ILeafNode {
  type: 'leaf'
  paneId: string
}

export type ILayoutNode = ISplitNode | ILeafNode

export interface ITerminalTab extends IBaseTab {
  id: string
  title: string
  layout: ILayoutNode
}

function collectPaneIds(node: ILayoutNode): string[] {
  if (node.type === 'leaf') return [node.paneId]
  return [...collectPaneIds(node.first), ...collectPaneIds(node.second)]
}

function splitNode(
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

function removePane(
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

class Store extends BaseStore {
  tabs: ITerminalTab[] = []
  activeTabId = ''
  activePaneId = ''
  paneTitles: Record<string, string> = {}
  pendingCwd: Record<string, string> = {}
  onDestroyPane: ((paneId: string) => void) | null = null

  private tabCounter = 0

  constructor() {
    super()
    makeAutoObservable(this, {
      onDestroyPane: false,
      pendingCwd: false,
    })
    this.addTab()
  }

  addTab(afterTabId?: string) {
    this.tabCounter++
    const paneId = uuid()
    const id = uuid()
    const tab: ITerminalTab = {
      id,
      title: `Terminal ${this.tabCounter}`,
      layout: { type: 'leaf', paneId },
    }

    if (afterTabId) {
      const index = this.tabs.findIndex((t) => t.id === afterTabId)
      if (index !== -1) {
        this.tabs.splice(index + 1, 0, tab)
      } else {
        this.tabs.push(tab)
      }
    } else {
      this.tabs.push(tab)
    }

    this.activeTabId = id
    this.activePaneId = paneId
  }

  closeTab(id: string) {
    if (this.tabs.length <= 1) {
      window.close()
      return
    }

    const tab = this.tabs.find((t) => t.id === id)
    if (!tab) return

    const paneIds = collectPaneIds(tab.layout)
    paneIds.forEach((pid) => this.onDestroyPane?.(pid))

    const index = this.tabs.findIndex((t) => t.id === id)
    this.tabs.splice(index, 1)

    if (this.tabs.length === 0) {
      this.addTab()
      return
    }

    if (this.activeTabId === id) {
      const newIndex = Math.min(index, this.tabs.length - 1)
      this.activeTabId = this.tabs[newIndex].id
      const newTab = this.tabs[newIndex]
      const paneIds = collectPaneIds(newTab.layout)
      this.activePaneId = paneIds[0]
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
    const tab = this.tabs.find((t) => t.id === id)
    if (tab) {
      const paneIds = collectPaneIds(tab.layout)
      if (!paneIds.includes(this.activePaneId)) {
        this.activePaneId = paneIds[0]
      }
    }
  }

  setActivePane(paneId: string) {
    this.activePaneId = paneId
    const title = this.paneTitles[paneId]
    if (title) {
      const tab = this.tabs.find((t) => t.id === this.activeTabId)
      if (tab) {
        tab.title = title
      }
    }
  }

  setPaneTitle(paneId: string, title: string) {
    if (this.paneTitles[paneId] === title) return
    this.paneTitles[paneId] = title

    // Update tab title if this pane is the active pane
    if (paneId === this.activePaneId) {
      const tab = this.tabs.find((t) => t.id === this.activeTabId)
      if (tab) {
        tab.title = title
      }
    }
  }

  moveTab(fromIndex: number, toIndex: number) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tabs.length ||
      toIndex >= this.tabs.length
    ) {
      return
    }
    const [tab] = this.tabs.splice(fromIndex, 1)
    this.tabs.splice(toIndex, 0, tab)
  }

  splitPane(paneId: string, direction: SplitDirection) {
    const tab = this.tabs.find((t) => t.id === this.activeTabId)
    if (!tab) return

    const newPaneId = uuid()
    const cwd = terminal.getFullCwd(paneId)
    if (cwd) {
      this.pendingCwd[newPaneId] = cwd
    }
    tab.layout = splitNode(tab.layout, paneId, direction, newPaneId)
    this.activePaneId = newPaneId
  }

  closePane(paneId: string) {
    const tab = this.tabs.find((t) => t.id === this.activeTabId)
    if (!tab) return

    const paneIds = collectPaneIds(tab.layout)
    if (paneIds.length <= 1) return

    this.onDestroyPane?.(paneId)
    const result = removePane(tab.layout, paneId)
    if (result) {
      tab.layout = result
    }

    if (this.activePaneId === paneId) {
      const remaining = collectPaneIds(tab.layout)
      this.activePaneId = remaining[0]
    }
  }
}

export default new Store()
