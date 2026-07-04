import type LocalStore from 'licia/LocalStore'
import { STORAGE_CHAT_MODEL, STORAGE_CHAT_PROVIDER } from './storage'

export abstract class ChatPrefsStorage {
  abstract getProvider(): string
  abstract getModel(): string
  abstract setProvider(name: string): void
  abstract setModel(name: string): void
}

export class LocalStoreChatPrefs extends ChatPrefsStorage {
  constructor(private storage: LocalStore) {
    super()
  }

  getProvider() {
    return this.storage.get(STORAGE_CHAT_PROVIDER) || ''
  }

  getModel() {
    return this.storage.get(STORAGE_CHAT_MODEL) || ''
  }

  setProvider(name: string) {
    this.storage.set(STORAGE_CHAT_PROVIDER, name)
  }

  setModel(name: string) {
    this.storage.set(STORAGE_CHAT_MODEL, name)
  }
}
