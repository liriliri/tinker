export interface MindMapNode {
  uid: string
  isRoot: boolean
  isGeneralization: boolean
  parent: MindMapNode | null
  children: MindMapNode[]
  data: Record<string, unknown>
  getData(key: string): unknown
  setHyperlink(url: string, title: string): void
  setNote(note: string): void
}

interface MindMapView {
  scale: number
  enlarge(): void
  narrow(): void
  setScale(scale: number): void
  fit(): void
}

interface MindMapRenderer {
  copy(): void
  cut(): void
  paste(): void
}

export interface MindMapInstance {
  view: MindMapView
  renderer: MindMapRenderer
  on(event: string, handler: (...args: any[]) => void): void
  off(event: string, handler: (...args: any[]) => void): void
  execCommand(command: string, ...args: unknown[]): void
  setData(data: unknown): void
  setFullData(data: unknown): void
  getData(withRoot?: boolean): { root: unknown; layout: string; theme: string }
  setLayout(layout: string): void
  setTheme(theme: string): void
  export(type: string, withPadding: boolean, name: string): Promise<string>
  resize(): void
  destroy(): void
}
