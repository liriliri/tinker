import { destroyTerminal } from '../components/Terminal'
import type { IBaseTab } from '../components/TabBar'
import type TerminalStore from '../store/Terminal'
import type { ILayoutNode, SplitDirection } from '../types/terminalLayout'

export interface TerminalTabItem extends IBaseTab {
  layout: ILayoutNode
}

export interface TerminalPanelUIState {
  tabs: TerminalTabItem[]
  activeTabId: string
  activePaneId: string
  paneTitles: Record<string, string>
  isDark: boolean
}

export interface TerminalPanelUIActions {
  onAddTab: () => void
  onCloseTab: (id: string) => void
  onActivateTab: (id: string) => void
  onMoveTab: (fromIndex: number, toIndex: number) => void
  onSetDualColumns: () => void
  onSetTripleColumns: () => void
  onSetGrid: () => void
  onSetActivePane: (paneId: string) => void
  onSetPaneTitle: (paneId: string, title: string) => void
  onSplitPane: (paneId: string, direction: SplitDirection) => void
  onClosePane: (paneId: string) => void
  createSession: (
    paneId: string,
    cols: number,
    rows: number
  ) => ReturnType<typeof tinker.createTerminal>
}

export type TerminalPanelProps = TerminalPanelUIState & TerminalPanelUIActions

export type TerminalPaneLayoutProps = Pick<
  TerminalPanelProps,
  | 'activePaneId'
  | 'paneTitles'
  | 'isDark'
  | 'onSetActivePane'
  | 'onSetPaneTitle'
  | 'onSplitPane'
  | 'onClosePane'
  | 'createSession'
>

/** Map a MobX `TerminalStore` to plain UI props. Call inside an observer. */
export function getTerminalPanelProps(
  terminal: TerminalStore,
  isDark: boolean
): TerminalPanelProps {
  terminal.onDestroyPane = destroyTerminal

  return {
    tabs: terminal.tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      layout: tab.layout,
    })),
    activeTabId: terminal.activeTabId,
    activePaneId: terminal.activePaneId,
    paneTitles: terminal.paneTitles,
    isDark,
    onAddTab: () => terminal.addTab(),
    onCloseTab: (id) => terminal.closeTab(id),
    onActivateTab: (id) => terminal.setActiveTab(id),
    onMoveTab: (from, to) => terminal.moveTab(from, to),
    onSetDualColumns: () => terminal.setDualColumns(),
    onSetTripleColumns: () => terminal.setTripleColumns(),
    onSetGrid: () => terminal.setGrid(),
    onSetActivePane: (paneId) => terminal.setActivePane(paneId),
    onSetPaneTitle: (paneId, title) => terminal.setPaneTitle(paneId, title),
    onSplitPane: (paneId, direction) => terminal.splitPane(paneId, direction),
    onClosePane: (paneId) => terminal.closePane(paneId),
    createSession: (paneId, cols, rows) => {
      const pendingCwd = terminal.pendingCwd[paneId]
      if (pendingCwd) {
        delete terminal.pendingCwd[paneId]
      }
      return tinker.createTerminal({
        cols,
        rows,
        cwd: pendingCwd || terminal.rootPath || undefined,
      })
    },
  }
}
