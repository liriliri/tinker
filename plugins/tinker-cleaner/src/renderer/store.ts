import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import type { CleanRule, Category } from './types'
import { resolveRules } from './lib/rules'

const localStore = new LocalStore('tinker-cleaner')

class Store extends BaseStore {
  view: 'scanning' | 'result' = 'scanning'
  rules: CleanRule[] = []
  selectedRules: Set<string> = new Set()
  activeCategory: Category | 'all' = 'all'
  scanning = false
  cleaning = false
  scanProgress = { current: 0, total: 0 }
  currentScanPath = ''
  moveToTrash: boolean = localStore.get('moveToTrash') !== false

  constructor() {
    super()
    makeAutoObservable(this)
  }

  async init() {
    const homePath = cleaner.getHomePath()
    const defs = resolveRules(homePath)
    runInAction(() => {
      this.rules = defs.map((def) => ({
        id: def.id,
        category: def.category,
        nameKey: def.nameKey,
        path: def.pathTemplate,
        size: 0,
        scanned: false,
      }))
    })
    await this.scan()
  }

  get visibleRules(): CleanRule[] {
    return this.rules.filter((r) => r.scanned && r.size > 0)
  }

  get filteredRules(): CleanRule[] {
    if (this.activeCategory === 'all') return this.visibleRules
    return this.visibleRules.filter((r) => r.category === this.activeCategory)
  }

  get selectedSize(): number {
    let size = 0
    for (const rule of this.rules) {
      if (this.selectedRules.has(rule.id)) {
        size += rule.size
      }
    }
    return size
  }

  get selectedCount(): number {
    return this.selectedRules.size
  }

  get totalScannedSize(): number {
    let size = 0
    for (const rule of this.rules) {
      if (rule.scanned) {
        size += rule.size
      }
    }
    return size
  }

  getCategorySize(category: Category): number {
    let size = 0
    for (const rule of this.rules) {
      if (rule.category === category && rule.scanned) {
        size += rule.size
      }
    }
    return size
  }

  setActiveCategory(category: Category | 'all') {
    this.activeCategory = category
  }

  toggleRule(id: string) {
    if (this.selectedRules.has(id)) {
      this.selectedRules.delete(id)
    } else {
      this.selectedRules.add(id)
    }
  }

  selectAll() {
    for (const rule of this.filteredRules) {
      this.selectedRules.add(rule.id)
    }
  }

  deselectAll() {
    for (const rule of this.filteredRules) {
      this.selectedRules.delete(rule.id)
    }
  }

  get allFilteredSelected(): boolean {
    return this.filteredRules.every((r) => this.selectedRules.has(r.id))
  }

  setMoveToTrash(value: boolean) {
    this.moveToTrash = value
    localStore.set('moveToTrash', value)
  }

  async scan() {
    this.view = 'scanning'
    this.scanning = true
    this.scanProgress = { current: 0, total: this.rules.length }

    for (let i = 0; i < this.rules.length; i++) {
      const rule = this.rules[i]
      runInAction(() => {
        this.currentScanPath = rule.path
      })
      try {
        const result = await tinker.getDiskUsage({
          paths: [rule.path],
          maxDepth: 0,
          minRatio: 0,
          silentErrors: true,
        })
        runInAction(() => {
          rule.size = result.size
          rule.scanned = true
          this.scanProgress.current = i + 1
        })
      } catch {
        runInAction(() => {
          rule.size = 0
          rule.scanned = true
          this.scanProgress.current = i + 1
        })
      }
    }

    runInAction(() => {
      this.scanning = false
      this.currentScanPath = ''
      this.selectedRules = new Set(
        this.rules.filter((r) => r.size > 0).map((r) => r.id)
      )
      this.view = 'result'
    })
  }

  async clean(): Promise<{ cleaned: number; errors: string[] }> {
    this.cleaning = true
    let totalCleaned = 0
    const allErrors: string[] = []

    const rulesToClean = this.rules.filter((r) => this.selectedRules.has(r.id))

    for (const rule of rulesToClean) {
      try {
        const result = await cleaner.cleanPath(rule.path, this.moveToTrash)
        totalCleaned += result.cleaned
        allErrors.push(...result.errors)
        runInAction(() => {
          rule.size = 0
          rule.scanned = false
        })
      } catch {
        allErrors.push(rule.path)
      }
    }

    runInAction(() => {
      this.cleaning = false
    })

    return { cleaned: totalCleaned, errors: allErrors }
  }
}

export default new Store()
