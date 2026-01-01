import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import { calculateAllHashes, type HashAlgorithm } from './lib/hash'

type Encoding = 'utf-8' | 'base64' | 'hex'
type InputType = 'text' | 'file'

class Store extends BaseStore {
  input: string = ''
  hashResults: Record<HashAlgorithm, string> = {
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  }
  uppercase: boolean = false
  encoding: Encoding = 'utf-8'
  inputType: InputType = 'text'

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setInput(value: string) {
    this.input = value
    this.calculateHashes()
  }

  setUppercase(value: boolean) {
    this.uppercase = value
    this.calculateHashes()
  }

  setEncoding(value: Encoding) {
    this.encoding = value
    this.calculateHashes()
  }

  setInputType(value: InputType) {
    this.inputType = value
  }

  calculateHashes() {
    if (!this.input) {
      this.hashResults = {
        md5: '',
        sha1: '',
        sha256: '',
        sha512: '',
      }
      return
    }

    const results = calculateAllHashes(this.input)

    if (this.uppercase) {
      this.hashResults = {
        md5: results.md5.toUpperCase(),
        sha1: results.sha1.toUpperCase(),
        sha256: results.sha256.toUpperCase(),
        sha512: results.sha512.toUpperCase(),
      }
    } else {
      this.hashResults = results
    }
  }
}

const store = new Store()

export default store
