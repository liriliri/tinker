import { Languages, Format, OptionMap } from './types'

export default abstract class<T extends Languages> implements Format<T> {
  protected name: T | string = ''
  protected code: string = ''
  protected option?: OptionMap[T]

  getOptionValue<K extends keyof OptionMap[T]>(
    key: K,
    defaultValue: OptionMap[T][K]
  ) {
    if (this.option === undefined || this.option[key] === undefined) {
      return defaultValue
    }
    return this.option[key]
  }

  setName(value: T) {
    this.name = value
    return this
  }

  set(code: string, option?: OptionMap[T]) {
    this.code = code
    this.option = option
    return this
  }

  async beautify(): Promise<string> {
    throw new Error(`${this.name} beautify not supported`)
  }

  async format(): Promise<string> {
    return this.beautify()
  }
}
