import { makeAutoObservable } from 'mobx'
import type { Highlighter } from 'shiki'
import BaseStore from 'share/BaseStore'

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
  tsx: {
    name: 'TSX',
    src: () => import('shiki/langs/tsx.mjs'),
  },
  jsx: {
    name: 'JSX',
    src: () => import('shiki/langs/jsx.mjs'),
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

const defaultCode = `import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`

class Store extends BaseStore {
  // Shiki highlighter
  highlighter: Highlighter | null = null

  // Code state
  code: string = defaultCode
  selectedLanguage: Language = LANGUAGES.tsx

  // Theme state
  darkMode: boolean = true

  // Window title
  fileName: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setHighlighter(highlighter: Highlighter) {
    this.highlighter = highlighter
  }

  setCode(code: string) {
    this.code = code
  }

  setLanguage(language: Language) {
    this.selectedLanguage = language
  }

  setDarkMode(darkMode: boolean) {
    this.darkMode = darkMode
  }

  setFileName(fileName: string) {
    this.fileName = fileName
  }
}

const store = new Store()

export default store
