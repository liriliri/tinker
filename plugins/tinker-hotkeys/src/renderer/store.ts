import { makeAutoObservable, runInAction } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import isArr from 'licia/isArr'
import lowerCase from 'licia/lowerCase'
import filter from 'licia/filter'
import map from 'licia/map'
import some from 'licia/some'
import uuid from 'licia/uuid'
import contain from 'licia/contain'
import BaseStore, { storage } from 'share/store/Base'
import type { Action, ActionInput, ActionType, FilterTab } from './types'
import { ensureUrl, normalizeAction } from './lib/util'
import { createMcpApi } from './mcp'

const STORAGE_ACTIONS = 'actions'
const STORAGE_FILTER_TAB = 'filterTab'

const FILTER_TABS: FilterTab[] = [
  'all',
  'command',
  'plugin',
  'app',
  'directory',
  'url',
]

const registered = new Map<string, () => void>()

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  actions: Action[] = []
  searchQuery = ''
  filterTab: FilterTab = 'all'
  showDialog = false
  dialogType: ActionType = 'command'
  editingAction: Action | null = null
  unboundIds: string[] = []

  constructor() {
    super()
    makeAutoObservable(this)
    this.load()
    void this.syncHotkeys()
  }

  private load() {
    const saved = storage.get<unknown[] | undefined>(STORAGE_ACTIONS)
    if (isArr(saved)) {
      this.actions = map(saved, (item) =>
        normalizeAction(item as Partial<Action> & { id: string })
      )
    }
    const filterTab = storage.get<FilterTab | undefined>(STORAGE_FILTER_TAB)
    if (filterTab && contain(FILTER_TABS, filterTab)) {
      this.filterTab = filterTab
    }
  }

  private persist() {
    storage.set(STORAGE_ACTIONS, this.actions)
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  setFilterTab(tab: FilterTab) {
    this.filterTab = tab
    storage.set(STORAGE_FILTER_TAB, tab)
  }

  get filteredActions(): Action[] {
    let result = this.actions
    if (this.filterTab !== 'all') {
      result = filter(result, (action) => action.type === this.filterTab)
    }
    if (isStrBlank(this.searchQuery)) {
      return result
    }
    const query = lowerCase(this.searchQuery)
    return filter(result, (action) =>
      some([action.name, action.hotkey, action.command], (text) =>
        contain(lowerCase(text), query)
      )
    )
  }

  openAddDialog(type: ActionType = 'command') {
    this.editingAction = null
    this.dialogType = type
    this.showDialog = true
  }

  openEditDialog(action: Action) {
    this.editingAction = action
    this.dialogType = action.type
    this.showDialog = true
  }

  closeDialog() {
    this.showDialog = false
    this.editingAction = null
  }

  async addAction(input: ActionInput): Promise<Action> {
    const action: Action = { ...input, id: uuid() }
    this.actions.push(action)
    this.persist()
    await this.syncHotkeys()
    return action
  }

  async updateAction(id: string, input: ActionInput) {
    const index = this.actions.findIndex((a) => a.id === id)
    if (index < 0) return
    this.actions[index] = { ...input, id }
    this.persist()
    await this.syncHotkeys()
  }

  async removeAction(id: string) {
    this.actions = this.actions.filter((a) => a.id !== id)
    this.persist()
    await this.syncHotkeys()
  }

  async toggleEnabled(id: string) {
    const action = this.actions.find((a) => a.id === id)
    if (!action) return
    action.enabled = !action.enabled
    this.persist()
    await this.syncHotkeys()
  }

  async runAction(id: string) {
    const action = this.actions.find((a) => a.id === id)
    if (!action || isStrBlank(action.command)) return

    if (action.type === 'url') {
      tinker.openExternal(ensureUrl(action.command))
      return
    }

    if (action.type === 'plugin') {
      await tinker.openPlugin(action.command)
      return
    }

    const result =
      action.type === 'app'
        ? await hotkeys.openApp(action.command)
        : action.type === 'directory'
        ? await hotkeys.openDirectory(action.command)
        : await hotkeys.execCommand(action.command)

    if (result.stderr && !result.stdout) {
      tinker.showNotification(`${action.name}: ${result.stderr}`)
    }
  }

  private async syncHotkeys() {
    for (const off of [...registered.values()]) {
      off()
    }
    registered.clear()

    const unbound: string[] = []
    for (const action of this.actions) {
      if (
        !action.enabled ||
        isStrBlank(action.hotkey) ||
        isStrBlank(action.command)
      ) {
        continue
      }
      if (registered.has(action.hotkey)) {
        unbound.push(action.id)
        continue
      }
      try {
        const off = await tinker.registerShortcut(action.hotkey, () => {
          void this.runAction(action.id)
        })
        registered.set(action.hotkey, off)
      } catch {
        unbound.push(action.id)
      }
    }

    runInAction(() => {
      this.unboundIds = unbound
    })
  }

  isUnbound(id: string) {
    return this.unboundIds.includes(id)
  }
}

export default new Store()
