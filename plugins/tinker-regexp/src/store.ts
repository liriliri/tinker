import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import {
  initAiChatAvailability,
  toggleAiChatOpen,
} from 'share/lib/aiChat/aiAvailability'
import { createChatDb } from 'share/lib/aiChat/chatDb'
import { createChatSession } from 'share/lib/aiChat/chatSession'
import AiChatStore from 'share/store/AiChat'
import BaseStore from 'share/BaseStore'
import { REGEXP_AGENT_TOOLS } from './lib/chatTools'
import type { Match } from './types'

const storage = new LocalStore('tinker-regexp')

const STORAGE_PATTERN = 'pattern'
const STORAGE_FLAGS = 'flags'
const STORAGE_TEXT = 'text'

const chatDb = createChatDb('tinker-regexp')
const chatSession = createChatSession({
  chatDb,
  systemPrompt:
    'You are a regular expression assistant. Help the user write, debug, and understand JavaScript regular expressions. You have tools to read and update the editor pattern, flags, and test text. Use tools only when you need current editor values or must apply changes. After reading or updating, reply to the user with a clear explanation. Do not call tools again unless the user asks for another change or check.',
  tools: REGEXP_AGENT_TOOLS,
})

class Store extends BaseStore {
  chat = new AiChatStore({ storage, chatDb, chatSession })

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
    makeAutoObservable(this, { chat: false })
    this.loadStorage()
    void initAiChatAvailability(storage).then(({ hasAI, chatOpen }) => {
      this.hasAI = hasAI
      this.chatOpen = chatOpen
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
    if (!this.hasAI) return
    this.chatOpen = toggleAiChatOpen(storage, this.chatOpen)
  }

  get isEmpty() {
    return !this.pattern
  }
}

export default new Store()
