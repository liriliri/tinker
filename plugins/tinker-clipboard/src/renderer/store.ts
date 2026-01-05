import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import * as db from './lib/db'

// Clipboard item types
export type ClipboardType = 'text' | 'image' | 'file'

// Filter tabs
export type FilterTab = 'all' | 'text' | 'image' | 'file'

// Clipboard item interface
export interface ClipboardItem {
  id: string
  type: ClipboardType
  data: string // For text: plain text, For image: base64, For file: JSON stringified file paths
  preview?: string // Preview text (first 200 chars for text, file names for files)
  timestamp: number
}

// Storage keys
const STORAGE_KEY_FILTER_TAB = 'filter-tab'
const STORAGE_KEY_SEARCH_QUERY = 'search-query'

const storage = new LocalStore('tinker-clipboard')

class Store extends BaseStore {
  // Clipboard history items
  items: ClipboardItem[] = []

  // Current filter tab
  filterTab: FilterTab = 'all'

  // Search query
  searchQuery: string = ''

  // Loading state
  isLoaded = false

  // Lazy loading
  private lazyIndex = 20 // Show 20 items initially
  private readonly lazyStep = 20 // Load 20 more each time

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  // Computed: all filtered items (not displayed directly)
  private get allFilteredItems(): ClipboardItem[] {
    let result = this.items

    // Filter by tab
    if (this.filterTab !== 'all') {
      result = result.filter((item) => item.type === this.filterTab)
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase()
      result = result.filter((item) => {
        const preview = item.preview || item.data
        return preview.toLowerCase().includes(query)
      })
    }

    return result
  }

  // Computed: items to display (lazy loaded)
  get filteredItems(): ClipboardItem[] {
    return this.allFilteredItems.slice(0, this.lazyIndex)
  }

  // Check if there are more items to load
  get hasMore(): boolean {
    return this.allFilteredItems.length > this.lazyIndex
  }

  // Actions
  setFilterTab(tab: FilterTab) {
    this.filterTab = tab
    this.resetLazyIndex()
    this.saveFilters()
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
    this.resetLazyIndex()
    this.saveFilters()
  }

  loadMore() {
    if (this.hasMore) {
      this.lazyIndex += this.lazyStep
    }
  }

  private resetLazyIndex() {
    this.lazyIndex = 20
  }

  addItem(item: ClipboardItem) {
    // Check if item already exists
    const existingIndex = this.items.findIndex((i) => i.id === item.id)
    if (existingIndex !== -1) {
      // Move to top and update timestamp
      const existing = this.items[existingIndex]
      existing.timestamp = item.timestamp
      this.items.splice(existingIndex, 1)
      this.items.unshift(existing)
      // Update existing item in DB
      db.addItem(existing)
    } else {
      // Add new item to the top
      this.items.unshift(item)
      // Add new item to DB
      db.addItem(item)
    }
  }

  removeItem(id: string) {
    this.items = this.items.filter((item) => item.id !== id)
    db.removeItem(id)
  }

  clearAll() {
    this.items = []
    db.clearAll()
  }

  // Persistence
  private async loadFromStorage() {
    try {
      // Load filter preferences from LocalStore
      const filterTab = storage.get(STORAGE_KEY_FILTER_TAB)
      const searchQuery = storage.get(STORAGE_KEY_SEARCH_QUERY)

      if (filterTab) {
        this.filterTab = filterTab as FilterTab
      }
      if (searchQuery) {
        this.searchQuery = searchQuery
      }

      // Load clipboard items from IndexedDB
      const items = await db.getAllItems()
      if (items.length > 0) {
        // Sort by timestamp descending
        this.items = items.sort((a, b) => b.timestamp - a.timestamp)
      }
      this.isLoaded = true
    } catch (error) {
      console.error('Failed to load from storage:', error)
      this.isLoaded = true
    }
  }

  private saveFilters() {
    try {
      storage.set(STORAGE_KEY_FILTER_TAB, this.filterTab)
      storage.set(STORAGE_KEY_SEARCH_QUERY, this.searchQuery)
    } catch (error) {
      console.error('Failed to save filters:', error)
    }
  }
}

export default new Store()
