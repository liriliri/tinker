import { makeAutoObservable } from 'mobx'
import i18n from 'i18next'
import isStrBlank from 'licia/isStrBlank'
import uuid from 'licia/uuid'
import contain from 'licia/contain'
import debounce from 'licia/debounce'
import sleep from 'licia/sleep'
import extend from 'licia/extend'
import clone from 'licia/clone'
import clamp from 'licia/clamp'
import BaseStore, { storage } from 'share/store/Base'
import {
  INNER_SLOT_COUNT,
  OUTER_SLOT_COUNT,
  type ActionType,
  type InvokeMode,
  type SlotAction,
  type SlotActionInput,
  type SlotRing,
  type Slots,
} from './types'
import {
  ensureUrl,
  emptySlots,
  normalizeOuterSlots,
  normalizeSlots,
} from './lib/util'
import {
  closePieWindow,
  openAlwaysOnPieWindow,
  openInvokePieWindow,
} from './lib/pieWindow'
import {
  startMiddleLongPress,
  stopMiddleLongPress,
} from './lib/middleLongPress'

const STORAGE_SLOTS = 'slots'
const STORAGE_OUTER_SLOTS = 'outerSlots'
const STORAGE_DUAL_RING = 'dualRing'
const STORAGE_INVOKE_MODE = 'invokeMode'

const INVOKE_MODES: InvokeMode[] = ['alwaysOn', 'middleClick']

class Store extends BaseStore {
  slots: Slots = emptySlots()
  outerSlots: Slots = emptySlots(OUTER_SLOT_COUNT)
  dualRing = false
  invokeMode: InvokeMode = 'alwaysOn'
  selectedRing: SlotRing = 'inner'
  selectedSlot = 0

  constructor() {
    super()
    makeAutoObservable(this)
    tinker.setBackgroundThrottling(false)
    this.load()
  }

  private load() {
    this.slots = normalizeSlots(storage.get(STORAGE_SLOTS))
    this.outerSlots = normalizeOuterSlots(storage.get(STORAGE_OUTER_SLOTS))
    this.dualRing = storage.get(STORAGE_DUAL_RING) === true
    const mode = storage.get<InvokeMode | undefined>(STORAGE_INVOKE_MODE)
    if (mode && contain(INVOKE_MODES, mode)) {
      this.invokeMode = mode
    }
  }

  private slotCount(ring: SlotRing) {
    return ring === 'outer' ? OUTER_SLOT_COUNT : INNER_SLOT_COUNT
  }

  private slotList(ring: SlotRing) {
    return ring === 'outer' ? this.outerSlots : this.slots
  }

  private storageKey(ring: SlotRing) {
    return ring === 'outer' ? STORAGE_OUTER_SLOTS : STORAGE_SLOTS
  }

  private persistRing(ring: SlotRing, immediate = false) {
    if (immediate) {
      storage.set(this.storageKey(ring), this.slotList(ring))
      return
    }
    if (ring === 'outer') persistOuterSlotsSoon()
    else persistSlotsSoon()
  }

  setDualRing(enabled: boolean) {
    if (this.dualRing === enabled) return
    this.dualRing = enabled
    storage.set(STORAGE_DUAL_RING, enabled)
    if (!enabled && this.selectedRing === 'outer') {
      this.selectedRing = 'inner'
      this.selectedSlot = clamp(
        Math.floor(this.selectedSlot / 2),
        0,
        INNER_SLOT_COUNT - 1
      )
    }
  }

  setInvokeMode(mode: InvokeMode) {
    if (this.invokeMode === mode) return
    this.invokeMode = mode
    storage.set(STORAGE_INVOKE_MODE, mode)
    void this.applyInvokeMode()
  }

  selectSlot(index: number, ring: SlotRing = 'inner') {
    if (ring === 'outer' && !this.dualRing) return
    if (index < 0 || index >= this.slotCount(ring)) return
    this.selectedRing = ring
    this.selectedSlot = index
  }

  get selectedAction(): SlotAction | null {
    return this.slotList(this.selectedRing)[this.selectedSlot] ?? null
  }

  addSlot(type: ActionType) {
    this.setSlot(this.selectedSlot, this.selectedRing, {
      name: '',
      command: '',
      enabled: true,
      type,
    })
  }

  setSlot(index: number, ring: SlotRing, input: SlotActionInput) {
    if (index < 0 || index >= this.slotCount(ring)) return
    const list = this.slotList(ring)
    list[index] = extend({}, input, {
      id: list[index]?.id || uuid(),
    }) as SlotAction
    this.persistRing(ring, true)
  }

  patchSlot(index: number, patch: Partial<SlotActionInput>, ring?: SlotRing) {
    const targetRing = ring ?? this.selectedRing
    const list = this.slotList(targetRing)
    const action = list[index]
    if (!action || index < 0 || index >= this.slotCount(targetRing)) return
    // Replace the slot object so observers that read slots[i] re-render.
    list[index] = extend(clone(action), patch)
    this.persistRing(targetRing)
  }

  clearSlot(index: number, ring?: SlotRing) {
    const targetRing = ring ?? this.selectedRing
    if (index < 0 || index >= this.slotCount(targetRing)) return
    this.slotList(targetRing)[index] = null
    this.persistRing(targetRing, true)
  }

  toggleSlotEnabled(index: number, ring?: SlotRing) {
    const targetRing = ring ?? this.selectedRing
    const list = this.slotList(targetRing)
    const action = list[index]
    if (!action) return
    list[index] = extend(clone(action), { enabled: !action.enabled })
    this.persistRing(targetRing, true)
  }

  async runSlot(index: number, ring: SlotRing = 'inner') {
    const action = this.slotList(ring)[index]
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
      tinker.showNotification(
        i18n.t('actionError', { name: action.name, error: result.stderr })
      )
    }
  }

  async applyInvokeMode() {
    await stopMiddleLongPress()
    closePieWindow()
    // Wait for the always-on popup to finish unregistering mouse handlers.
    await sleep(50)

    if (this.invokeMode === 'alwaysOn') {
      openAlwaysOnPieWindow()
      return
    }

    await startMiddleLongPress((point) => {
      openInvokePieWindow(point)
    })
  }
}

const store = new Store()

const persistSlotsSoon = debounce(() => {
  storage.set(STORAGE_SLOTS, store.slots)
}, 300)

const persistOuterSlotsSoon = debounce(() => {
  storage.set(STORAGE_OUTER_SLOTS, store.outerSlots)
}, 300)

export default store
