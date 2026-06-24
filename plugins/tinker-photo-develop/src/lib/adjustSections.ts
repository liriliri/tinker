import each from 'licia/each'
import isBool from 'licia/isBool'
import isObj from 'licia/isObj'
import LocalStore from 'licia/LocalStore'
import {
  ADJUST_SECTION_IDS,
  DEFAULT_SECTION_OPEN,
  type SectionOpenState,
} from '../types/adjustSections'

const storage = new LocalStore('tinker-photo-develop')
const STORAGE_SECTION_OPEN = 'sectionOpen'

export function loadSectionOpenState(): SectionOpenState {
  const saved = storage.get(STORAGE_SECTION_OPEN) as
    | Partial<SectionOpenState>
    | undefined

  if (!isObj(saved)) {
    return { ...DEFAULT_SECTION_OPEN }
  }

  const next = { ...DEFAULT_SECTION_OPEN }
  const stored = saved as Partial<SectionOpenState>

  each(ADJUST_SECTION_IDS, (id) => {
    if (isBool(stored[id])) {
      next[id] = stored[id]
    }
  })

  return next
}

export function saveSectionOpenState(state: SectionOpenState) {
  storage.set(STORAGE_SECTION_OPEN, state)
}
