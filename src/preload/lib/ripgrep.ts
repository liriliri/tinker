import { spawn, ChildProcess } from 'child_process'
import { rgPath } from '@vscode/ripgrep'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import each from 'licia/each'
import map from 'licia/map'
import ltrim from 'licia/ltrim'
import normalizePath from 'licia/normalizePath'
import { isDev } from 'share/common/util'

function getRgPath(): string {
  let path = rgPath || ''
  if (!path) {
    throw new Error('Ripgrep binary not found')
  }
  if (!isDev()) {
    path = path.replace('app.asar', 'app.asar.unpacked')
  }
  return path
}

export interface SearchTextSubmatch {
  text: string
  start: number
  end: number
}

export interface SearchTextResult {
  path: string
  lineNumber: number
  text: string
  submatches: SearchTextSubmatch[]
}

export interface SearchTextOptions {
  dirs?: string[]
  exts?: string[]
  /** Include pattern string (VS Code search viewlet format) */
  includes?: string
  /** Exclude pattern string */
  excludes?: string
  /** Legacy ripgrep glob patterns. Prefer includes/excludes. */
  globs?: string[]
  caseSensitive?: boolean
  wholeWord?: boolean
  regex?: boolean
  multiline?: boolean
  maxResults?: number
  maxFilesize?: string
  hidden?: boolean
  followSymlinks?: boolean
}

export type OnMatch = (match: SearchTextResult) => void

class SearchTextTask {
  private rgProcess: ChildProcess | null = null
  private promise: Promise<SearchTextResult[]>
  private searchRoot: string

  constructor(query: string, options: SearchTextOptions, onMatch?: OnMatch) {
    this.searchRoot = options.dirs?.[0] || process.cwd()
    this.promise = this.run(query, options, onMatch)
  }

  private run(
    query: string,
    options: SearchTextOptions,
    onMatch?: OnMatch
  ): Promise<SearchTextResult[]> {
    const {
      exts,
      includes,
      excludes,
      globs,
      caseSensitive = false,
      wholeWord = false,
      regex = false,
      multiline = false,
      maxResults = 1000,
      maxFilesize,
      hidden = false,
      followSymlinks = false,
    } = options

    const args: string[] = ['--json']

    if (!caseSensitive) args.push('--ignore-case')
    if (wholeWord) args.push('--word-regexp')
    if (multiline) args.push('--multiline')
    if (hidden) args.push('--hidden')
    if (followSymlinks) args.push('-L')
    if (maxFilesize) args.push('--max-filesize', maxFilesize)
    if (maxResults > 0) args.push('--max-count', String(maxResults))

    each(exts || [], (ext) => {
      args.push('-g', `*.${ext}`)
    })

    let includeGlobs: string[] = []
    let excludeGlobs: string[] = []
    if (includes || excludes) {
      includeGlobs = parseScopePatterns(includes || '', this.searchRoot)
      excludeGlobs = parseScopePatterns(excludes || '', this.searchRoot)
    } else if (globs?.length) {
      includeGlobs = globs.filter((g) => !g.startsWith('!'))
      excludeGlobs = globs
        .filter((g) => g.startsWith('!'))
        .map((g) => g.slice(1))
    }

    if (includeGlobs.length) applyIncludeGlobs(args, includeGlobs)
    if (excludeGlobs.length) applyExcludeGlobs(args, excludeGlobs)

    if (regex) {
      args.push('--regexp', query)
    } else {
      args.push('--fixed-strings')
    }

    args.push('--')
    if (!regex) args.push(query)
    args.push('.')

    const rg = spawn(getRgPath(), args, { cwd: this.searchRoot })
    this.rgProcess = rg

    const results: SearchTextResult[] = []
    let stdoutBuf = ''

    return new Promise<SearchTextResult[]>((resolve) => {
      const stop = () => resolve(results.slice(0, maxResults))

      const emitResult = (result: SearchTextResult | null): boolean => {
        if (!result) return false
        results.push(result)
        if (onMatch) {
          try {
            onMatch(result)
          } catch {
            // ignore listener errors
          }
        }
        return results.length >= maxResults
      }

      rg.stdout?.on('data', (chunk: Buffer) => {
        stdoutBuf += chunk.toString()
        let nl: number
        while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
          const line = stdoutBuf.slice(0, nl)
          stdoutBuf = stdoutBuf.slice(nl + 1)
          if (!trim(line)) continue

          if (emitResult(parseLine(line, this.searchRoot))) {
            rg.kill()
            stop()
            return
          }
        }
      })

      rg.on('close', () => {
        if (stdoutBuf && trim(stdoutBuf)) {
          emitResult(parseLine(stdoutBuf, this.searchRoot))
        }
        stop()
      })

      rg.on('error', () => {
        stop()
      })
    })
  }

  getPromise(): Promise<SearchTextResult[]> {
    return this.promise
  }

  kill(): void {
    if (this.rgProcess && !this.rgProcess.killed) {
      this.rgProcess.kill('SIGKILL')
    }
  }

  quit(): void {
    if (this.rgProcess && !this.rgProcess.killed) {
      this.rgProcess.kill('SIGTERM')
    }
  }
}

class SearchTextTaskManager {
  private tasks = new Map<string, SearchTextTask>()

  run(
    query: string,
    options: SearchTextOptions = {},
    onMatch?: OnMatch
  ): { promise: Promise<SearchTextResult[]>; taskId: string } {
    const trimmed = trim(query)
    if (!trimmed) {
      return { promise: Promise.resolve([]), taskId: '' }
    }

    const taskId = uuid()
    const task = new SearchTextTask(trimmed, options, onMatch)
    this.tasks.set(taskId, task)

    const promise = task.getPromise().finally(() => {
      this.tasks.delete(taskId)
    })

    return { promise, taskId }
  }

  kill(taskId: string): void {
    this.tasks.get(taskId)?.kill()
  }

  quit(taskId: string): void {
    this.tasks.get(taskId)?.quit()
  }
}

const manager = new SearchTextTaskManager()

export function searchText(
  query: string,
  options: SearchTextOptions = {},
  onMatch?: OnMatch
): { promise: Promise<SearchTextResult[]>; taskId: string } {
  return manager.run(query, options, onMatch)
}

export function killSearchText(taskId: string): void {
  manager.kill(taskId)
}

export function quitSearchText(taskId: string): void {
  manager.quit(taskId)
}

interface RgJsonData {
  type: string
  data?: {
    path?: { text?: string; bytes?: string }
    lines?: { text?: string; bytes?: string }
    line_number?: number
    submatches?: Array<{
      match: { text?: string; bytes?: string }
      start: number
      end: number
    }>
  }
}

function parseLine(line: string, searchRoot: string): SearchTextResult | null {
  let parsed: RgJsonData
  try {
    parsed = JSON.parse(line) as RgJsonData
  } catch {
    return null
  }

  if (parsed.type !== 'match' || !parsed.data) return null
  const data = parsed.data

  const rawPath = data.path?.text ?? decodeBytes(data.path?.bytes)
  const path = rawPath ? resolveResultPath(rawPath, searchRoot) : ''
  const text = data.lines?.text ?? decodeBytes(data.lines?.bytes) ?? ''
  const lineNumber = data.line_number ?? 0
  if (!path) return null

  const submatches = map(data.submatches || [], (sm) => ({
    text: sm.match.text ?? decodeBytes(sm.match.bytes) ?? '',
    start: sm.start,
    end: sm.end,
  }))

  return { path, lineNumber, text, submatches }
}

function resolveResultPath(path: string, searchRoot: string): string {
  if (path.startsWith('/') || /^[a-zA-Z]:[/\\]/.test(path)) {
    return normalizePath(path)
  }

  const root = normalizePath(searchRoot)
  const rel = ltrim(path.replace(/\\/g, '/'), ['.', '/'])
  return rel ? normalizePath(`${root}/${rel}`) : root
}

function decodeBytes(bytes?: string): string | undefined {
  if (!bytes) return undefined
  try {
    return Buffer.from(bytes, 'base64').toString('utf8')
  } catch {
    return undefined
  }
}

// ---- Search include/exclude pattern parsing (VS Code queryBuilder + ripgrepTextSearchEngine) ----

const SEARCH_PATH_RE = /^\.\.?([/\\]|$)/
const GLOB_CHARS_RE = /[*?[{\\]/

function normalizeGlobPattern(pattern: string): string {
  return pattern.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/g, '')
}

function splitGlobPattern(pattern: string): string[] {
  const result: string[] = []
  let current = ''
  let inBrace = 0

  for (const ch of pattern) {
    if (ch === '{') inBrace++
    if (ch === '}') inBrace = Math.max(0, inBrace - 1)
    if (ch === ',' && inBrace === 0) {
      const trimmed = current.trim()
      if (trimmed) result.push(trimmed)
      current = ''
      continue
    }
    current += ch
  }

  const trimmed = current.trim()
  if (trimmed) result.push(trimmed)
  return result
}

function isSearchPath(segment: string): boolean {
  return (
    segment.startsWith('/') ||
    /^[a-zA-Z]:[/\\]/.test(segment) ||
    SEARCH_PATH_RE.test(segment)
  )
}

function expandGlobalGlob(pattern: string): string[] {
  const patterns = [`**/${pattern}/**`, `**/${pattern}`]
  return patterns.map((p) => p.replace(/\*\*\/\*\*/g, '**'))
}

function resolveSearchPathSegment(segment: string, rootDir: string): string {
  const normalized = segment.replace(/\\/g, '/')
  if (SEARCH_PATH_RE.test(normalized)) {
    return normalizeGlobPattern(normalized)
  }

  const rootNorm = normalizePath(rootDir)
  const segNorm = normalizePath(normalized)
  if (rootNorm && segNorm.startsWith(rootNorm)) {
    const rel = ltrim(segNorm.slice(rootNorm.length), ['/', '\\'])
    return rel ? normalizeGlobPattern(rel) : ''
  }

  return normalizeGlobPattern(normalized)
}

function appendFolderPatterns(patterns: string[], rel: string) {
  if (!rel || rel === '.') return
  patterns.push(rel)
  if (!rel.endsWith('**')) {
    patterns.push(`${rel}/**`)
  }
}

function appendExprPattern(patterns: string[], segment: string) {
  let normalized = normalizeGlobPattern(segment)
  if (!normalized) return

  if (normalized.startsWith('.')) {
    normalized = '*' + normalized
  }

  if (GLOB_CHARS_RE.test(normalized)) {
    patterns.push(normalized)
    return
  }

  patterns.push(...expandGlobalGlob(normalized))
}

function parseScopePatterns(pattern: string, rootDir: string): string[] {
  if (!pattern.trim()) return []

  const result: string[] = []
  for (const segment of splitGlobPattern(pattern)) {
    if (isSearchPath(segment)) {
      appendFolderPatterns(result, resolveSearchPathSegment(segment, rootDir))
    } else {
      appendExprPattern(result, segment)
    }
  }
  return result
}

function anchorGlob(glob: string): string {
  return glob.startsWith('**') || glob.startsWith('/') ? glob : `/${glob}`
}

function spreadGlobComponents(globComponent: string): string[] {
  const components = globComponent.split('/').filter((part) => part !== '')
  return components.map((_, i) => components.slice(0, i + 1).join('/'))
}

function applyIncludeGlobs(args: string[], includes: string[]) {
  const doubleStarIncludes: string[] = []
  const otherIncludes: string[] = []

  for (const include of includes) {
    if (include.startsWith('**')) {
      doubleStarIncludes.push(include)
    } else {
      otherIncludes.push(include)
    }
  }

  if (otherIncludes.length) {
    args.push('-g', '!*')
    const unique = [...new Set(otherIncludes)]
    for (const other of unique) {
      for (const component of spreadGlobComponents(other)) {
        args.push('-g', anchorGlob(component))
      }
    }
  }

  for (const g of doubleStarIncludes) {
    args.push('-g', g)
  }
}

function applyExcludeGlobs(args: string[], excludes: string[]) {
  for (const g of excludes) {
    args.push('-g', `!${anchorGlob(g)}`)
  }
}
