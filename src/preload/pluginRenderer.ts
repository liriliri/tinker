import { injectApi } from './lib/injectApi'
export { importData, exportData, clearData } from './renderer/data'
export {
  showRecordingCursor,
  hideRecordingCursor,
  moveRecordingCursorTo,
} from './renderer/cursor'

injectApi()
