import { Config, Languages, Format } from './types'
import sortBy from 'licia/sortBy'
import { formatter as javascriptFormatter } from './javascript'
import { formatter as typescriptFormatter } from './typescript'
import { formatter as cssFormatter } from './css'
import { formatter as htmlFormatter } from './html'
import { formatter as jsonFormatter } from './json'

const languages: { [k in Languages]: Config<k> } = {
  javascript: {
    beautify: true,
    load() {
      return Promise.resolve(javascriptFormatter)
    },
  },
  typescript: {
    beautify: true,
    load() {
      return Promise.resolve(typescriptFormatter)
    },
  },
  css: {
    beautify: true,
    load() {
      return Promise.resolve(cssFormatter)
    },
  },
  html: {
    beautify: true,
    load() {
      return Promise.resolve(htmlFormatter)
    },
  },
  json: {
    beautify: true,
    load() {
      return Promise.resolve(jsonFormatter)
    },
  },
}

const allLanguageType = sortBy(
  Object.keys(languages).filter((key): key is Languages => key in languages)
)

const load = async <T extends Languages>(name: T): Promise<Format<T>> => {
  const handle = await languages[name].load()
  handle.setName(name)
  return handle
}

export default {
  load,
  languages,
  allLanguageType,
}
