import { Languages } from './formatter/types'

export interface LanguageConfig {
  id: Languages
  name: string
}

export const LANGUAGES: { [key in Languages]: LanguageConfig } = {
  javascript: {
    id: 'javascript',
    name: 'JavaScript',
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
  },
  css: {
    id: 'css',
    name: 'CSS',
  },
  html: {
    id: 'html',
    name: 'HTML',
  },
  json: {
    id: 'json',
    name: 'JSON',
  },
}
