import LocalStore from 'licia/LocalStore'

const storage = new LocalStore('tinker-regexp')

export const STORAGE_PATTERN = 'pattern'
export const STORAGE_FLAGS = 'flags'
export const STORAGE_TEXT = 'text'
export const STORAGE_CHAT_OPEN = 'chatOpen'
export const STORAGE_PROVIDER = 'provider'
export const STORAGE_MODEL = 'model'

export default storage
