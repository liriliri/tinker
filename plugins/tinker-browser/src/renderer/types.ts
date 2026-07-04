export interface ISite {
  id: string
  name: string
  url: string
}

export interface IPageContext {
  title: string
  url: string
  isLoading: boolean
  getWebview: () => Electron.WebviewTag | undefined
}
