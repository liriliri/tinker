import { Config, Languages, Format } from './types'

const languages: { [k in Languages]: Config<k> } = {
  javascript: {
    beautify: true,
    load() {
      return import('./javascript').then((m) => m.formatter)
    },
  },
  typescript: {
    beautify: true,
    load() {
      return import('./typescript').then((m) => m.formatter)
    },
  },
  css: {
    beautify: true,
    load() {
      return import('./css').then((m) => m.formatter)
    },
  },
  html: {
    beautify: true,
    load() {
      return import('./html').then((m) => m.formatter)
    },
  },
  json: {
    beautify: true,
    load() {
      return import('./json').then((m) => m.formatter)
    },
  },
}

const allLanguageType = Object.keys(languages).sort() as Languages[]

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
