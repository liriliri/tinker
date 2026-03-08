import { makeAutoObservable, runInAction } from 'mobx'
import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import lowerCase from 'licia/lowerCase'
import sortBy from 'licia/sortBy'
import uuid from 'licia/uuid'
import BaseStore from 'share/BaseStore'
import type { RSSSource, RSSItem } from '../common/types'
import type { Filter, ViewMode } from './types'
import { getAllItems, addItems, putItem, deleteItemsBySource } from './lib/db'

const storage = new LocalStore('tinker-rss-reader')

class Store extends BaseStore {
  sources: RSSSource[] = []
  items: RSSItem[] = []
  selectedSourceId: string | null = null
  selectedItemId: string | null = null
  filter: Filter = 'all'
  searchQuery: string = ''
  refreshing: Record<string, boolean> = {}
  sidebarOpen: boolean = true
  viewMode: ViewMode = 'list'
  fullContent: string | null = null
  fullContentLoading: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.sources = (storage.get('sources') as RSSSource[]) || []
    this.sidebarOpen = (storage.get('sidebarOpen') as boolean) ?? true
    this.viewMode = (storage.get('viewMode') as ViewMode) ?? 'list'
    getAllItems().then((items) => {
      runInAction(() => {
        this.items = items
      })
    })
  }

  get filteredItems(): RSSItem[] {
    let result = this.selectedSourceId
      ? this.items.filter((item) => item.sourceId === this.selectedSourceId)
      : this.items.slice()
    if (this.filter === 'unread')
      result = result.filter((item) => !item.hasRead)
    if (!isStrBlank(this.searchQuery)) {
      const q = lowerCase(this.searchQuery)
      result = result.filter(
        (item) =>
          lowerCase(item.title).includes(q) ||
          lowerCase(item.snippet).includes(q)
      )
    }
    return sortBy(result, (item) => -item.date)
  }

  get selectedItem(): RSSItem | null {
    return find(this.items, (i) => i.id === this.selectedItemId) || null
  }

  get totalUnread(): number {
    return this.items.filter((i) => !i.hasRead).length
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set('sidebarOpen', this.sidebarOpen)
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    storage.set('viewMode', mode)
  }

  setSelectedSource(id: string | null) {
    this.selectedSourceId = id
    this.selectedItemId = null
  }

  setSelectedItem(id: string) {
    this.selectedItemId = id
    this.fullContent = null
    this.fullContentLoading = false
    const item = find(this.items, (i) => i.id === id)
    if (item && !item.hasRead) {
      item.hasRead = true
      const source = find(this.sources, (s) => s.id === item.sourceId)
      if (source) source.unreadCount = Math.max(0, source.unreadCount - 1)
      storage.set('sources', this.sources)
      putItem(item)
    }
  }

  closeArticle() {
    this.selectedItemId = null
    this.fullContent = null
    this.fullContentLoading = false
  }

  async loadFullContent(): Promise<void> {
    const item = this.selectedItem
    if (!item?.link || this.fullContentLoading) return
    this.fullContentLoading = true
    this.fullContent = null
    try {
      const result = await rssReader.fetchFullContent(item.link)
      runInAction(() => {
        this.fullContent = result.error ? null : result.content ?? null
        this.fullContentLoading = false
      })
    } catch {
      runInAction(() => {
        this.fullContentLoading = false
      })
    }
  }

  setFilter(filter: Filter) {
    this.filter = filter
    this.selectedItemId = null
  }

  setSearchQuery(q: string) {
    this.searchQuery = q
    this.selectedItemId = null
  }

  toggleRead(id: string) {
    const item = find(this.items, (i) => i.id === id)
    if (!item) return
    item.hasRead = !item.hasRead
    const source = find(this.sources, (s) => s.id === item.sourceId)
    if (source) {
      source.unreadCount = this.items.filter(
        (i) => i.sourceId === source.id && !i.hasRead
      ).length
      storage.set('sources', this.sources)
    }
    putItem(item)
  }

  markAllRead() {
    const targetIds = this.selectedSourceId
      ? new Set([this.selectedSourceId])
      : new Set(this.sources.map((s) => s.id))
    const changed: RSSItem[] = []
    this.items.forEach((i) => {
      if (targetIds.has(i.sourceId) && !i.hasRead) {
        i.hasRead = true
        changed.push(i)
      }
    })
    this.sources.forEach((s) => {
      if (targetIds.has(s.id)) s.unreadCount = 0
    })
    storage.set('sources', this.sources)
    addItems(changed)
  }

  async addSource(url: string): Promise<void> {
    if (this.sources.some((s) => s.url === url)) {
      throw new Error('Feed already exists')
    }
    const result = await rssReader.fetchFeed(url)
    if (result.error) throw new Error(result.error)
    const id = uuid()
    const fetchedItems = result.items ?? []
    const source: RSSSource = {
      id,
      url,
      name: result.title || url,
      iconUrl: '',
      lastFetched: Date.now(),
      unreadCount: fetchedItems.length,
    }
    const newItems: RSSItem[] = fetchedItems.map((item) => ({
      id: uuid(),
      sourceId: id,
      ...item,
      hasRead: false,
    }))
    await addItems(newItems)
    runInAction(() => {
      this.sources.push(source)
      this.items.push(...newItems)
      storage.set('sources', this.sources)
    })
  }

  async deleteSource(id: string): Promise<void> {
    this.sources = this.sources.filter((s) => s.id !== id)
    this.items = this.items.filter((i) => i.sourceId !== id)
    if (this.selectedSourceId === id) this.selectedSourceId = null
    if (this.selectedItem?.sourceId === id) this.selectedItemId = null
    storage.set('sources', this.sources)
    await deleteItemsBySource(id)
  }

  async refreshSource(id: string): Promise<void> {
    const source = find(this.sources, (s) => s.id === id)
    if (!source || this.refreshing[id]) return
    runInAction(() => {
      this.refreshing[id] = true
    })
    try {
      const result = await rssReader.fetchFeed(source.url)
      if (result.error) throw new Error(result.error)
      const parsedItems = result.items ?? []
      const existingLinks = new Set(
        this.items.filter((i) => i.sourceId === id).map((i) => i.link)
      )
      const newItems: RSSItem[] = parsedItems
        .filter((item) => item.link && !existingLinks.has(item.link))
        .map((item) => ({
          id: uuid(),
          sourceId: id,
          ...item,
          hasRead: false,
        }))
      await addItems(newItems)
      runInAction(() => {
        this.items.push(...newItems)
        source.lastFetched = Date.now()
        source.unreadCount = this.items.filter(
          (i) => i.sourceId === id && !i.hasRead
        ).length
        if (result.title) source.name = result.title
        storage.set('sources', this.sources)
      })
    } finally {
      runInAction(() => {
        delete this.refreshing[id]
      })
    }
  }

  async refreshAll(): Promise<void> {
    await Promise.all(this.sources.map((s) => this.refreshSource(s.id)))
  }
}

export default new Store()
