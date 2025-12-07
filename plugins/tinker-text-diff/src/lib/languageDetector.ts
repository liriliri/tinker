// Common programming languages supported by Monaco Editor
export const SUPPORTED_LANGUAGES = [
  { id: 'plaintext', label: 'Plain Text' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'json', label: 'JSON' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'sql', label: 'SQL' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'yaml', label: 'YAML' },
  { id: 'xml', label: 'XML' },
  { id: 'shell', label: 'Shell' },
  { id: 'swift', label: 'Swift' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'dart', label: 'Dart' },
]

// Map file extensions to Monaco language IDs
const extensionToLanguage: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  less: 'less',

  // Data
  json: 'json',
  jsonc: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ini: 'ini',

  // Python
  py: 'python',
  pyw: 'python',
  pyx: 'python',

  // Java/JVM
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'scala',
  groovy: 'groovy',

  // C/C++
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  hh: 'cpp',
  hxx: 'cpp',

  // C#
  cs: 'csharp',

  // Web backend
  php: 'php',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',

  // Shell
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',

  // SQL
  sql: 'sql',
  mysql: 'sql',
  pgsql: 'sql',

  // Markdown
  md: 'markdown',
  markdown: 'markdown',

  // Swift
  swift: 'swift',

  // Dart
  dart: 'dart',

  // Others
  lua: 'lua',
  r: 'r',
  m: 'objective-c',
  perl: 'perl',
  pl: 'perl',
  dockerfile: 'dockerfile',
  vue: 'html',
  svelte: 'html',
}

export function detectLanguageFromFileName(fileName: string): string {
  if (!fileName) return 'plaintext'

  // Get file extension
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
    // Check for special filenames without extension
    const lowerFileName = fileName.toLowerCase()
    if (lowerFileName === 'dockerfile') return 'dockerfile'
    if (lowerFileName === 'makefile') return 'makefile'
    return 'plaintext'
  }

  const extension = fileName.slice(lastDotIndex + 1).toLowerCase()
  return extensionToLanguage[extension] || 'plaintext'
}
