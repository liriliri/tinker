import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import type { Match } from './types'

const storage = new LocalStore('tinker-regexp')

class Store extends BaseStore {
  pattern: string = '([A-Z])\\w+'
  flags: string = 'g'
  testText: string = `Tinker RegExp is a regular expression testing tool, inspired by RegExr.

Edit the Expression above and the Text below to see matches in real-time. Matched text will be highlighted in blue. Hover over matches to see detailed information including position and capture groups.

This plugin supports JavaScript RegEx flavor with common flags: g (global), i (case insensitive), m (multiline), s (dotall), u (unicode), and y (sticky).`

  matches: Match[] = []
  error: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadState()
  }

  private loadState() {
    const savedPattern = storage.get('pattern')
    const savedFlags = storage.get('flags')
    const savedText = storage.get('text')

    if (savedPattern) this.pattern = savedPattern
    if (savedFlags) this.flags = savedFlags
    if (savedText) this.testText = savedText

    this.updateMatches()
  }

  setPattern(pattern: string) {
    this.pattern = pattern
    storage.set('pattern', pattern)
    this.updateMatches()
  }

  setFlags(flags: string) {
    this.flags = flags
    storage.set('flags', flags)
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
    storage.set('text', text)
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

  get isEmpty() {
    return !this.pattern
  }
}

const store = new Store()

export default store
