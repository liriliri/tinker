import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { ITab } from '../common/types'

const NEW_TAB_URL = ''
const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q='

class Store extends BaseStore {
  tabs: ITab[] = []
  activeTabId = ''
  addressBarValue = ''
  addressBarFocused = false

  webviewRefs: Map<string, Electron.WebviewTag> = new Map()

  private nextId = 1

  constructor() {
    super()
    makeAutoObservable(this, {
      webviewRefs: false,
    })
    this.addTab()
  }

  get activeTab(): ITab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId)
  }

  addTab(url: string = NEW_TAB_URL) {
    const id = `tab-${this.nextId++}`
    const tab: ITab = {
      id,
      url,
      title: '',
      favicon: '',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
    }
    this.tabs.push(tab)
    this.activeTabId = id
    this.addressBarValue = url
  }

  closeTab(id: string) {
    const index = this.tabs.findIndex((t) => t.id === id)
    if (index === -1) return

    this.webviewRefs.delete(id)
    this.tabs.splice(index, 1)

    if (this.tabs.length === 0) {
      this.addTab()
      return
    }

    if (this.activeTabId === id) {
      const newIndex = Math.min(index, this.tabs.length - 1)
      this.setActiveTab(this.tabs[newIndex].id)
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
    const tab = this.tabs.find((t) => t.id === id)
    if (tab) {
      this.addressBarValue = tab.url
    }
  }

  setAddressBarValue(value: string) {
    this.addressBarValue = value
  }

  setAddressBarFocused(focused: boolean) {
    this.addressBarFocused = focused
  }

  navigate(input: string) {
    const tab = this.activeTab
    if (!tab) return

    let url = input.trim()
    if (!url) return

    if (this.isValidUrl(url)) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
    } else {
      url = DEFAULT_SEARCH_ENGINE + encodeURIComponent(url)
    }

    tab.url = url
    this.addressBarValue = url
    this.addressBarFocused = false

    const webview = this.webviewRefs.get(tab.id)
    if (webview) {
      webview.loadURL(url)
    }
  }

  private isValidUrl(str: string): boolean {
    if (str.startsWith('http://') || str.startsWith('https://')) return true
    if (str.includes(' ')) return false
    if (str.includes('.')) return true
    if (str.startsWith('localhost')) return true
    return false
  }

  updateTabTitle(tabId: string, title: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (tab) tab.title = title
  }

  updateTabFavicon(tabId: string, favicon: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (tab) tab.favicon = favicon
  }

  updateTabLoading(tabId: string, isLoading: boolean) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (tab) tab.isLoading = isLoading
  }

  updateTabUrl(tabId: string, url: string) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (tab) {
      tab.url = url
      if (tab.id === this.activeTabId) {
        this.addressBarValue = url
      }
    }
  }

  updateTabNavState(tabId: string, canGoBack: boolean, canGoForward: boolean) {
    const tab = this.tabs.find((t) => t.id === tabId)
    if (tab) {
      tab.canGoBack = canGoBack
      tab.canGoForward = canGoForward
    }
  }

  goBack() {
    const wv = this.activeTab && this.webviewRefs.get(this.activeTab.id)
    if (wv) wv.goBack()
  }

  goForward() {
    const wv = this.activeTab && this.webviewRefs.get(this.activeTab.id)
    if (wv) wv.goForward()
  }

  reload() {
    const wv = this.activeTab && this.webviewRefs.get(this.activeTab.id)
    if (wv) {
      if (this.activeTab?.isLoading) {
        wv.stop()
      } else {
        wv.reload()
      }
    }
  }
}

export default new Store()
