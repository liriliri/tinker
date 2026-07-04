export type SplitDirection = 'horizontal' | 'vertical'

export interface TabPaneContext {
  paneId: string
  tabTitle: string
  paneTitle: string
}

export interface ISplitNode {
  type: 'split'
  direction: SplitDirection
  first: ILayoutNode
  second: ILayoutNode
  firstSize?: string
  key?: string
}

export interface ILeafNode {
  type: 'leaf'
  paneId: string
}

export type ILayoutNode = ISplitNode | ILeafNode
