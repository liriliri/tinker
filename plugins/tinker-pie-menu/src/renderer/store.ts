import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import uuid from 'licia/uuid'
import contain from 'licia/contain'
import BaseStore, { storage } from 'share/store/Base'
import type {
  ActionType,
  InvokeMode,
  SlotAction,
  SlotActionInput,
  Slots,
} from './types'
import { SLOT_COUNT } from './types'
import { ensureUrl, emptySlots, normalizeSlots } from './lib/util'
import {
  closePieWindow,
  openAlwaysOnPieWindow,
  openInvokePieWindow,
} from './lib/pieWindow'

const STORAGE_SLOTS = 'slots'
const STORAGE_INVOKE_MODE = 'invokeMode'

const INVOKE_MODES: InvokeMode[] = ['alwaysOn', 'middleClick']

export class Store extends BaseStore {
  slots: Slots = emptySlots()
  invokeMode: InvokeMode = 'alwaysOn'
  selectedSlot = 0
  dialogType: ActionType = 'command'
  showDialog = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.load()
  }

  private load() {
    this.slots = normalizeSlots(storage.get(STORAGE_SLOTS))
    const mode = storage.get<InvokeMode | undefined>(STORAGE_INVOKE_MODE)
    if (mode && contain(INVOKE_MODES, mode)) {
      this.invokeMode = mode
    }
  }

  private persistSlots() {
    storage.set(STORAGE_SLOTS, this.slots)
  }

  setInvokeMode(mode: InvokeMode) {
    if (this.invokeMode === mode) return
    this.invokeMode = mode
    storage.set(STORAGE_INVOKE_MODE, mode)
    void this.applyInvokeMode()
  }

  selectSlot(index: number) {
    if (index < 0 || index >= SLOT_COUNT) return
    this.selectedSlot = index
  }

  get selectedAction(): SlotAction | null {
    return this.slots[this.selectedSlot] ?? null
  }

  openAddDialog(type: ActionType = 'command') {
    this.dialogType = type
    this.showDialog = true
  }

  openEditDialog() {
    const action = this.selectedAction
    if (!action) return
    this.dialogType = action.type
    this.showDialog = true
  }

  closeDialog() {
    this.showDialog = false
  }

  async setSlot(index: number, input: SlotActionInput) {
    if (index < 0 || index >= SLOT_COUNT) return
    const existing = this.slots[index]
    this.slots[index] = { ...input, id: existing?.id || uuid() }
    this.persistSlots()
  }

  async clearSlot(index: number) {
    if (index < 0 || index >= SLOT_COUNT) return
    this.slots[index] = null
    this.persistSlots()
  }

  async toggleSlotEnabled(index: number) {
    const action = this.slots[index]
    if (!action) return
    action.enabled = !action.enabled
    this.persistSlots()
  }

  async runSlot(index: number) {
    const action = this.slots[index]
    if (!action || !action.enabled || isStrBlank(action.command)) return

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
        ? await pieMenu.openApp(action.command)
        : action.type === 'directory'
        ? await pieMenu.openDirectory(action.command)
        : await pieMenu.execCommand(action.command)

    if (result.stderr && !result.stdout) {
      tinker.showNotification(`${action.name}: ${result.stderr}`)
    }
  }

  async applyInvokeMode() {
    pieMenu.stopMiddleClickListen()
    closePieWindow()

    if (this.invokeMode === 'alwaysOn') {
      openAlwaysOnPieWindow()
      return
    }

    pieMenu.startMiddleClickListen((point) => {
      openInvokePieWindow(point)
    })
  }
}

export default new Store()
