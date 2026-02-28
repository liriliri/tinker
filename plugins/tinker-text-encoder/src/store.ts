import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import toast from 'react-hot-toast'
import i18n from './i18n'

export type EncodingType = 'url' | 'morse' | 'unicode'

const STORAGE_KEY = 'content'
const ENCODING_TYPE_KEY = 'encodingType'

const storage = new LocalStore('tinker-text-encoder')

class Store extends BaseStore {
  inputText: string = ''
  outputText: string = ''
  encodingType: EncodingType = 'url'

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const savedContent = storage.get(STORAGE_KEY)
    const savedEncodingType = storage.get(ENCODING_TYPE_KEY)

    if (savedContent) {
      try {
        const { input, output } = JSON.parse(savedContent)
        this.inputText = input || ''
        this.outputText = output || ''
      } catch {
        // ignore
      }
    }

    if (savedEncodingType) {
      this.encodingType = savedEncodingType as EncodingType
    }
  }

  private saveToStorage() {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({
        input: this.inputText,
        output: this.outputText,
      })
    )
  }

  setInputText(value: string) {
    this.inputText = value
    this.saveToStorage()
  }

  setOutputText(value: string) {
    this.outputText = value
    this.saveToStorage()
  }

  setEncodingType(type: EncodingType) {
    this.encodingType = type
    storage.set(ENCODING_TYPE_KEY, type)
  }

  clearInput() {
    this.inputText = ''
    this.saveToStorage()
  }

  clearOutput() {
    this.outputText = ''
    this.saveToStorage()
  }

  async copyToClipboardWithToast(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(i18n.t('copiedSuccess'))
    } catch {
      toast.error(i18n.t('copiedFailed'))
    }
  }

  async pasteToInput() {
    try {
      const text = await navigator.clipboard.readText()
      this.setInputText(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }
}

export default new Store()
