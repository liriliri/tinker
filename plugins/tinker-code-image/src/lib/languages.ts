export interface Language {
  name: string
  src: () => Promise<any>
}

export const LANGUAGES: { [index: string]: Language } = {
  javascript: {
    name: 'JavaScript',
    src: () => import('shiki/langs/javascript.mjs'),
  },
  typescript: {
    name: 'TypeScript',
    src: () => import('shiki/langs/typescript.mjs'),
  },
  python: {
    name: 'Python',
    src: () => import('shiki/langs/python.mjs'),
  },
  java: {
    name: 'Java',
    src: () => import('shiki/langs/java.mjs'),
  },
  go: {
    name: 'Go',
    src: () => import('shiki/langs/go.mjs'),
  },
  rust: {
    name: 'Rust',
    src: () => import('shiki/langs/rust.mjs'),
  },
  cpp: {
    name: 'C++',
    src: () => import('shiki/langs/cpp.mjs'),
  },
  html: {
    name: 'HTML',
    src: () => import('shiki/langs/html.mjs'),
  },
  css: {
    name: 'CSS',
    src: () => import('shiki/langs/css.mjs'),
  },
  json: {
    name: 'JSON',
    src: () => import('shiki/langs/json.mjs'),
  },
  shell: {
    name: 'Shell',
    src: () => import('shiki/langs/bash.mjs'),
  },
}
