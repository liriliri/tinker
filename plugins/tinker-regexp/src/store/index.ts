import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { Match } from '../types'
import Chat from './Chat'
import storage, {
  STORAGE_CHAT_OPEN,
  STORAGE_FLAGS,
  STORAGE_PATTERN,
  STORAGE_TEXT,
} from './storage'

class Store extends BaseStore {
  chat: Chat

  pattern: string = '([A-Z])\\w+'
  flags: string = 'g'
  testText: string = `Tinker RegExp is a regular expression testing tool, inspired by RegExr.

Edit the Expression above and the Text below to see matches in real-time. Matched text will be highlighted in blue. Hover over matches to see detailed information including position and capture groups.

This plugin supports JavaScript RegEx flavor with common flags: g (global), i (case insensitive), m (multiline), s (dotall), u (unicode), and y (sticky).`

  matches: Match[] = []
  error: string | null = null
  hasAI: boolean = false
  chatOpen: boolean = false

  constructor() {
    super()
    this.chat = new Chat()
    makeAutoObservable(this, { chat: false })
    this.loadStorage()
    void tinker.getAIProviders().then((providers) => {
      if (providers.length > 0) {
        this.hasAI = true
        const savedChatOpen = storage.get(STORAGE_CHAT_OPEN)
        if (savedChatOpen !== undefined) {
          this.chatOpen = savedChatOpen === true
        }
        return
      }
      this.hasAI = false
      this.chatOpen = false
    })
  }

  private loadStorage() {
    const savedPattern = storage.get(STORAGE_PATTERN)
    const savedFlags = storage.get(STORAGE_FLAGS)
    const savedText = storage.get(STORAGE_TEXT)

    if (savedPattern) this.pattern = savedPattern
    if (savedFlags) this.flags = savedFlags
    if (savedText) this.testText = savedText

    this.updateMatches()
  }

  setPattern(pattern: string) {
    this.pattern = pattern
    storage.set(STORAGE_PATTERN, pattern)
    this.updateMatches()
  }

  setFlags(flags: string) {
    this.flags = flags
    storage.set(STORAGE_FLAGS, flags)
    this.updateMatches()
  }

  toggleFlag(flag: string) {
    if (this.flags.includes(flag)) {
      this.setFlags(this.flags.replace(flag, ''))
    } else {
      this.setFlags(this.flags + flag)
    }
  }

  setTestText(text: string) {
    this.testText = text
    storage.set(STORAGE_TEXT, text)
    this.updateMatches()
  }

  updateMatches() {
    this.error = null
    this.matches = []

    if (!this.pattern) {
      return
    }

    try {
      const regex = new RegExp(this.pattern, this.flags)
      const matches: Match[] = []
      let match: RegExpExecArray | null

      while ((match = regex.exec(this.testText)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0],
          groups: match.slice(1),
        })

        // Prevent infinite loop
        if (!regex.global) break
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }

      this.matches = matches
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e)
    }
  }

  async pasteFromClipboard() {
    const text = await navigator.clipboard.readText()
    this.setPattern(text)
  }

  clearPattern() {
    this.setPattern('')
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen
    if (this.hasAI) {
      storage.set(STORAGE_CHAT_OPEN, this.chatOpen)
    }
  }

  get isEmpty() {
    return !this.pattern
  }
}

export default new Store()
