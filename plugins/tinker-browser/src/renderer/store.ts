import { makeAutoObservable, runInAction } from 'mobx'
import uuid from 'licia/uuid'
import isArr from 'licia/isArr'
import isStr from 'licia/isStr'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import type { ITab } from '../common/types'
import type { ISite } from './types'
import { getAllFavicons, saveFavicon, removeFavicon } from './lib/db'

const NEW_TAB_URL = ''
const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q='
const DEVTOOLS_POSITIONS = ['bottom', 'left', 'right'] as const

const storage = new LocalStore('tinker-browser')
type DevToolsPosition = (typeof DEVTOOLS_POSITIONS)[number]

class Store extends BaseStore {
  tabs: ITab[] = []
  activeTabId = ''
  addressBarValue = ''
  addressBarFocused = false

  sites: ISite[] = []
  favicons: Map<string, string> = new Map()
  showSiteDialog = false
  editingSite: ISite | null = null

  webviewRefs: Map<string, Electron.WebviewTag> = new Map()
  devToolsOpen = false
  devToolsPosition: DevToolsPosition = 'bottom'
  devToolsWebviewRef: Electron.WebviewTag | null = null

  private nextId = 1

  constructor() {
    super()
    makeAutoObservable(this, {
      webviewRefs: false,
      devToolsWebviewRef: false,
      pendingInspect: false,
    })
    this.addTab()
    this.loadSites()
  }

  private loadSites() {
    const saved = storage.get('sites')
    if (isArr(saved)) {
      this.sites = saved
    }

    const savedDevToolsPosition = storage.get('devToolsPosition')
    if (
      isStr(savedDevToolsPosition) &&
      contain(DEVTOOLS_POSITIONS as unknown as string[], savedDevToolsPosition)
    ) {
      this.devToolsPosition = savedDevToolsPosition as DevToolsPosition
    }

    getAllFavicons().then((map) => {
      runInAction(() => {
        this.favicons = map
      })
    })
  }

  private saveSites() {
    storage.set('sites', this.sites)
  }

  openSiteDialog(site?: ISite) {
    this.editingSite = site || null
    this.showSiteDialog = true
  }

  closeSiteDialog() {
    this.showSiteDialog = false
    this.editingSite = null
  }

  addSite(name: string, url: string) {
    const id = uuid()
    this.sites.push({ id, name, url })
    this.saveSites()
    this.closeSiteDialog()
    this.fetchAndCacheFavicon(id, url)
  }

  updateSite(id: string, name: string, url: string) {
    const site = this.sites.find((s) => s.id === id)
    if (!site) return

    const urlChanged = site.url !== url
    site.name = name
    site.url = url
    this.saveSites()
    this.closeSiteDialog()

    if (urlChanged) {
      this.fetchAndCacheFavicon(id, url)
    }
  }

  removeSite(id: string) {
    this.sites = this.sites.filter((s) => s.id !== id)
    this.saveSites()
    this.favicons.delete(id)
    removeFavicon(id)
  }

  private async fetchAndCacheFavicon(id: string, url: string) {
    let fullUrl = url
    if (!startWith(fullUrl, 'http://') && !startWith(fullUrl, 'https://')) {
      fullUrl = 'https://' + fullUrl
    }
    const data = await browser.fetchFavicon(fullUrl)
    if (data) {
      runInAction(() => {
        this.favicons.set(id, data)
      })
      saveFavicon(id, data)
    }
  }

  get activeTab(): ITab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId)
  }

  addTab(url: string = NEW_TAB_URL, afterTabId?: string) {
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

    if (startWith(url, 'view-source:')) {
      tab.url = url
      this.addressBarValue = url
      this.addressBarFocused = false
      const webview = this.webviewRefs.get(tab.id)
      if (webview) {
        webview.loadURL(url)
      }
      return
    }

    if (this.isValidUrl(url)) {
      if (!startWith(url, 'http://') && !startWith(url, 'https://')) {
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
    if (startWith(str, 'http://') || startWith(str, 'https://')) return true
    if (str.includes(' ')) return false
    if (str.includes('.')) return true
    if (startWith(str, 'localhost')) return true
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
      if (
        startWith(tab.url, 'view-source:') &&
        !startWith(url, 'view-source:')
      ) {
        return
      }
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

  openDevTools() {
    this.devToolsOpen = true
  }

  closeDevTools() {
    this.devToolsOpen = false
  }

  setDevToolsPosition(position: DevToolsPosition) {
    this.devToolsPosition = position
    storage.set('devToolsPosition', position)
  }

  toggleDevTools() {
    this.devToolsOpen = !this.devToolsOpen
  }

  pendingInspect: { x: number; y: number } | null = null

  inspectElement(x: number, y: number) {
    const wv = this.activeTab && this.webviewRefs.get(this.activeTab.id)
    if (!wv) return

    if (!this.devToolsOpen) {
      this.devToolsOpen = true
      this.pendingInspect = { x, y }
    } else {
      wv.inspectElement(x, y)
    }
  }

  connectDevTools() {
    const wv = this.activeTab && this.webviewRefs.get(this.activeTab.id)
    const devWv = this.devToolsWebviewRef
    if (!wv || !devWv) return

    const doConnect = () => {
      try {
        ;(wv as tinker.WebviewTag).showDevTools(devWv).then(() => {
          if (this.pendingInspect) {
            const { x, y } = this.pendingInspect
            this.pendingInspect = null
            wv.inspectElement(x, y)
          }
        })
      } catch {
        // WebView not ready yet
      }
    }

    try {
      wv.getWebContentsId()
      doConnect()
    } catch {
      const onDomReady = () => {
        wv.removeEventListener('dom-ready', onDomReady)
        doConnect()
      }
      wv.addEventListener('dom-ready', onDomReady)
    }
  }
}

export default new Store()
