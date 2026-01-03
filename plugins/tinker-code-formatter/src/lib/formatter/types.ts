type GlobalOption = {
  tab: number
}

export interface OptionMap {
  javascript: GlobalOption
  typescript: GlobalOption
  css: GlobalOption
  html: GlobalOption
  json: GlobalOption
}

export type Languages = keyof OptionMap

export interface Format<T extends Languages> {
  format(): Promise<string>
  setName(value: T): Format<T>
  set(code: string, option?: OptionMap[T]): Format<T>
}

export interface Config<T extends Languages> {
  beautify: boolean
  load: () => Promise<Format<T>>
}
