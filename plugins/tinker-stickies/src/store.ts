import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import filter from 'licia/filter'
import lowerCase from 'licia/lowerCase'
import isStrBlank from 'licia/isStrBlank'
import stripHtmlTag from 'licia/stripHtmlTag'
import BaseStore from 'share/BaseStore'

export interface Sticky {
  id: string
  content: string
  color: string
  createdAt: number
  updatedAt: number
}

export const STICKY_COLORS = [
  '#fef08a', // yellow
  '#bbf7d0', // green
  '#bfdbfe', // blue
  '#fbcfe8', // pink
  '#d8b4fe', // purple
  '#fed7aa', // orange
]

const storage = new LocalStore('tinker-stickies')
const STORAGE_KEY_STICKIES = 'stickies'

class Store extends BaseStore {
  stickies: Sticky[] = []
  searchQuery: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStickies()
  }

  private loadStickies() {
    const saved = storage.get(STORAGE_KEY_STICKIES)
    if (saved) {
      this.stickies = saved as Sticky[]
    }
  }

  private saveStickies() {
    storage.set(STORAGE_KEY_STICKIES, this.stickies)
  }

  addSticky() {
    const sticky: Sticky = {
      id: uuid(),
      content: '',
      color: STICKY_COLORS[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.stickies.unshift(sticky)
    this.saveStickies()

    return sticky.id
  }

  deleteSticky(id: string) {
    this.stickies = filter(this.stickies, (s) => s.id !== id)
    this.saveStickies()
  }

  updateSticky(id: string, content: string) {
    const sticky = this.stickies.find((s) => s.id === id)
    if (!sticky) return
    sticky.content = content
    sticky.updatedAt = Date.now()
    this.saveStickies()
  }

  updateStickyColor(id: string, color: string) {
    const sticky = this.stickies.find((s) => s.id === id)
    if (!sticky) return
    sticky.color = color
    sticky.updatedAt = Date.now()
    this.saveStickies()
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  get filteredStickies(): Sticky[] {
    if (isStrBlank(this.searchQuery)) {
      return this.stickies
    }
    const query = lowerCase(this.searchQuery)
    return filter(this.stickies, (s) =>
      lowerCase(stripHtmlTag(s.content)).includes(query)
    )
  }
}

export default new Store()
