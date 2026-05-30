export interface Language {
  name: string
  mode: string
}

export const LANGUAGES: { [index: string]: Language } = {
  javascript: { name: 'JavaScript', mode: 'text/javascript' },
  typescript: { name: 'TypeScript', mode: 'text/typescript' },
  python: { name: 'Python', mode: 'text/x-python' },
  java: { name: 'Java', mode: 'text/x-java' },
  go: { name: 'Go', mode: 'text/x-go' },
  rust: { name: 'Rust', mode: 'text/x-rustsrc' },
  cpp: { name: 'C++', mode: 'text/x-c++src' },
  html: { name: 'HTML', mode: 'text/html' },
  css: { name: 'CSS', mode: 'text/css' },
  json: { name: 'JSON', mode: 'application/json' },
  shell: { name: 'Shell', mode: 'text/x-sh' },
}
