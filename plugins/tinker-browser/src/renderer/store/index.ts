import { makeAutoObservable, runInAction } from 'mobx'
import uuid from 'licia/uuid'
import isArr from 'licia/isArr'
import isStr from 'licia/isStr'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import BrowserTab from './BrowserTab'
import type { ISite } from '../types'
import { getAllFavicons, saveFavicon, removeFavicon } from '../lib/db'

const NEW_TAB_URL = ''
const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q='
const DEVTOOLS_POSITIONS = ['bottom', 'left', 'right'] as const

const storage = new LocalStore('tinker-browser')

const STORAGE_SITES = 'sites'
const STORAGE_DEVTOOLS_POSITION = 'devToolsPosition'

type DevToolsPosition = (typeof DEVTOOLS_POSITIONS)[number]

class Store extends BaseStore {
  tabs: BrowserTab[] = []
  activeTabId = ''
  addressBarValue = ''
  addressBarFocused = false

  sites: ISite[] = []
  favicons: Map<string, string> = new Map()
  showSiteDialog = false
  editingSite: ISite | null = null

  webviewRefs: Map<string, Electron.WebviewTag> = new Map()
  devToolsOpenTabs: Set<string> = new Set()
  devToolsPosition: DevToolsPosition = 'bottom'

  private nextId = 1

  constructor() {
    super()
    makeAutoObservable(this, {
      webviewRefs: false,
    })
    this.addTab()
    this.loadStorage()
  }

  private loadStorage() {
    const saved = storage.get(STORAGE_SITES)
    if (isArr(saved)) {
      this.sites = saved
    }

    const savedDevToolsPosition = storage.get<DevToolsPosition | undefined>(
      STORAGE_DEVTOOLS_POSITION
    )
    if (
      isStr(savedDevToolsPosition) &&
      contain(DEVTOOLS_POSITIONS, savedDevToolsPosition)
    ) {
      this.devToolsPosition = savedDevToolsPosition
    }

    getAllFavicons().then((map) => {
      runInAction(() => {
        this.favicons = map
      })
    })
  }

  private saveSites() {
    storage.set(STORAGE_SITES, this.sites)
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

  private getTab(id: string): BrowserTab | undefined {
    return this.tabs.find((t) => t.id === id)
  }

  private get activeWebview(): Electron.WebviewTag | undefined {
    const tab = this.activeTab
    return tab ? this.webviewRefs.get(tab.id) : undefined
  }

  get activeTab(): BrowserTab | undefined {
    return this.getTab(this.activeTabId)
  }

  get devToolsOpen(): boolean {
    return this.devToolsOpenTabs.has(this.activeTabId)
  }

  addTab(url: string = NEW_TAB_URL, afterTabId?: string) {
    const id = `tab-${this.nextId++}`
    const tab = new BrowserTab(id, url)
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
    if (this.tabs.length <= 1) {
      window.close()
      return
    }

    const index = this.tabs.findIndex((t) => t.id === id)
    if (index === -1) return

    this.webviewRefs.delete(id)
    this.devToolsOpenTabs.delete(id)
    this.tabs.splice(index, 1)

    if (this.activeTabId === id) {
      const newIndex = Math.min(index, this.tabs.length - 1)
      this.setActiveTab(this.tabs[newIndex].id)
    }
  }

  setActiveTab(id: string) {
    this.activeTabId = id
    const tab = this.getTab(id)
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

    if (!startWith(url, 'view-source:')) {
      if (this.isValidUrl(url)) {
        if (!startWith(url, 'http://') && !startWith(url, 'https://')) {
          url = 'https://' + url
        }
      } else {
        url = DEFAULT_SEARCH_ENGINE + encodeURIComponent(url)
      }
    }

    this.commitNavigation(tab, url)
  }

  private commitNavigation(tab: BrowserTab, url: string) {
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
    this.getTab(tabId)?.updateTitle(title)
  }

  updateTabFavicon(tabId: string, favicon: string) {
    this.getTab(tabId)?.updateFavicon(favicon)
  }

  updateTabLoading(tabId: string, isLoading: boolean) {
    this.getTab(tabId)?.updateLoading(isLoading)
  }

  updateTabUrl(tabId: string, url: string) {
    const tab = this.getTab(tabId)
    if (tab) {
      if (
        startWith(tab.url, 'view-source:') &&
        !startWith(url, 'view-source:')
      ) {
        return
      }
      tab.updateUrl(url)
      if (tab.id === this.activeTabId) {
        this.addressBarValue = url
      }
    }
  }

  updateTabNavState(tabId: string, canGoBack: boolean, canGoForward: boolean) {
    const tab = this.getTab(tabId)
    if (
      tab &&
      (tab.canGoBack !== canGoBack || tab.canGoForward !== canGoForward)
    ) {
      tab.updateNavState(canGoBack, canGoForward)
    }
  }

  goBack() {
    this.activeWebview?.goBack()
  }

  goForward() {
    this.activeWebview?.goForward()
  }

  reload() {
    const wv = this.activeWebview
    if (wv) {
      if (this.activeTab?.isLoading) {
        wv.stop()
      } else {
        wv.reload()
      }
    }
  }

  openDevTools() {
    this.devToolsOpenTabs.add(this.activeTabId)
  }

  closeDevTools() {
    this.devToolsOpenTabs.delete(this.activeTabId)
  }

  setDevToolsPosition(position: DevToolsPosition) {
    this.devToolsPosition = position
    storage.set(STORAGE_DEVTOOLS_POSITION, position)
  }

  toggleDevTools() {
    if (this.devToolsOpen) {
      this.closeDevTools()
    } else {
      this.openDevTools()
    }
  }

  pendingInspect: { x: number; y: number } | null = null

  inspectElement(x: number, y: number) {
    const wv = this.activeWebview
    if (!wv) return

    if (!this.devToolsOpen) {
      this.openDevTools()
      this.pendingInspect = { x, y }
    } else {
      wv.inspectElement(x, y)
    }
  }
}

export default new Store()
