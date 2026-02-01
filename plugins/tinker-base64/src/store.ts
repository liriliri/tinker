import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import toast from 'react-hot-toast'
import isDataUrl from 'licia/isDataUrl'
import dataUrl from 'licia/dataUrl'
import mime from 'licia/mime'
import { arrayBufferToBase64, base64ToUint8Array } from './lib/base64'
import { encodeBytesBase64, encodeFileBase64 } from './lib/base64Worker'
import i18n from './i18n'

type InputType = 'text' | 'file'

const storage = new LocalStore('tinker-base64')
const STORAGE_KEY_INPUT_TYPE = 'inputType'
const STORAGE_KEY_OUTPUT_AS_DATA_URL = 'outputAsDataUrl'

class Store extends BaseStore {
  inputType: InputType = 'text'
  inputText: string = ''
  outputText: string = ''
  fileName: string = ''
  private _fileBase64Raw: string = ''
  private _fileMimeType: string = ''
  outputAsDataUrl: boolean = false
  isEncodingFile: boolean = false

  get fileBase64(): string {
    if (!this._fileBase64Raw) return ''

    if (this.outputAsDataUrl && this._fileMimeType) {
      return dataUrl.stringify(this._fileBase64Raw, this._fileMimeType)
    }
    return this._fileBase64Raw
  }

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const savedInputType = storage.get(STORAGE_KEY_INPUT_TYPE)
    if (savedInputType === 'text' || savedInputType === 'file') {
      this.inputType = savedInputType
    }

    const savedOutputAsDataUrl = storage.get(STORAGE_KEY_OUTPUT_AS_DATA_URL)
    if (typeof savedOutputAsDataUrl === 'boolean') {
      this.outputAsDataUrl = savedOutputAsDataUrl
    }
  }

  setInputType(type: InputType) {
    this.inputType = type
    storage.set(STORAGE_KEY_INPUT_TYPE, type)
  }

  setInputText(value: string) {
    this.inputText = value
    if (this.outputText) {
      this.setOutputText('')
    }
  }

  setOutputText(value: string) {
    this.outputText = value
  }

  setOutputAsDataUrl(value: boolean) {
    this.outputAsDataUrl = value
    storage.set(STORAGE_KEY_OUTPUT_AS_DATA_URL, value)
  }

  async copyToClipboardWithToast(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(i18n.t('copiedSuccess'))
    } catch {
      toast.error(i18n.t('copiedFailed'))
    }
  }

  clearText() {
    this.inputText = ''
    this.outputText = ''
  }

  clearFile() {
    this.fileName = ''
    this._fileBase64Raw = ''
    this._fileMimeType = ''
  }

  encodeText() {
    try {
      this.setOutputText('')
      const encoder = new TextEncoder()
      const bytes = encoder.encode(this.inputText)
      const base64 = arrayBufferToBase64(bytes.buffer)
      this.setOutputText(base64)
    } catch (error) {
      console.error('Encode failed:', error)
      toast.error(i18n.t('encodeFailed'))
    }
  }

  decodeText() {
    try {
      const bytes = base64ToUint8Array(this.inputText)
      const decoder = new TextDecoder()
      const text = decoder.decode(bytes)
      this.setOutputText(text)
    } catch (error) {
      console.error('Decode failed:', error)
      toast.error(i18n.t('decodeFailed'))
    }
  }

  async decodeToFile() {
    try {
      const bytes = base64ToUint8Array(this.inputText)

      let defaultFileName = 'decoded.bin'
      const trimmed = this.inputText.trim()

      if (isDataUrl(trimmed)) {
        const parsed = dataUrl.parse(trimmed)
        if (parsed && parsed.mime) {
          const ext = mime(parsed.mime)
          if (ext) {
            defaultFileName = `decoded.${ext}`
          }
        }
      }

      const result = await tinker.showSaveDialog({
        defaultPath: defaultFileName,
      })

      if (result && result.filePath) {
        await tinker.writeFile(result.filePath, bytes)
      }
    } catch (error) {
      console.error('Failed to decode to file:', error)
      toast.error(i18n.t('decodeFailed'))
    }
  }

  async handleFile(file: File) {
    this.isEncodingFile = true
    this._fileBase64Raw = ''
    try {
      this.fileName = file.name
      this._fileBase64Raw = await encodeFileBase64(file)
      this._fileMimeType = file.type || 'application/octet-stream'
    } catch (error) {
      console.error('Failed to encode file:', error)
      toast.error(i18n.t('fileEncodeFailed'))
    } finally {
      this.isEncodingFile = false
    }
  }

  async handleFilePath(filePath: string) {
    this.isEncodingFile = true
    this._fileBase64Raw = ''
    try {
      const buffer = await tinker.readFile(filePath)
      const fileName = filePath.split(/[\\/]/).pop() || filePath
      this.fileName = fileName

      const base64Str = await encodeBytesBase64(buffer)
      const ext = fileName.split('.').pop() || ''
      const mimeType = mime(ext) || 'application/octet-stream'

      this._fileBase64Raw = base64Str
      this._fileMimeType = mimeType
    } catch (error) {
      console.error('Failed to encode file from path:', error)
      toast.error(i18n.t('fileEncodeFailed'))
    } finally {
      this.isEncodingFile = false
    }
  }
}

const store = new Store()

export default store
