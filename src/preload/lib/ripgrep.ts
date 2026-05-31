import { spawn, ChildProcess } from 'child_process'
import { rgPath } from '@vscode/ripgrep'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import each from 'licia/each'
import map from 'licia/map'
import { isDev } from 'share/common/util'

function getRgPath(): string {
  let path = rgPath || ''
  if (!path) {
    throw new Error('Ripgrep binary not found')
  }
  if (!isDev()) {
    path = path.replace('app.asar', 'app.asar.unpacked')
  }
  console.log('rgPath:', path)
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

  constructor(query: string, options: SearchTextOptions, onMatch?: OnMatch) {
    this.promise = this.run(query, options, onMatch)
  }

  private run(
    query: string,
    options: SearchTextOptions,
    onMatch?: OnMatch
  ): Promise<SearchTextResult[]> {
    const {
      dirs,
      exts,
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

    if (!regex) args.push('--fixed-strings')
    if (!caseSensitive) args.push('--ignore-case')
    if (wholeWord) args.push('--word-regexp')
    if (multiline) args.push('--multiline')
    if (hidden) args.push('--hidden')
    if (followSymlinks) args.push('-L')
    if (maxFilesize) args.push('--max-filesize', maxFilesize)
    if (maxResults > 0) args.push('--max-count', String(maxResults))

    each(exts || [], (ext) => {
      args.push('--glob', `*.${ext}`)
    })
    each(globs || [], (g) => {
      args.push('--glob', g)
    })

    args.push('--regexp', query)

    const searchDirs = dirs && dirs.length > 0 ? dirs : ['.']
    args.push('--', ...searchDirs)

    const rg = spawn(getRgPath(), args)
    this.rgProcess = rg

    const results: SearchTextResult[] = []
    let stdoutBuf = ''

    return new Promise<SearchTextResult[]>((resolve) => {
      const stop = () => resolve(results.slice(0, maxResults))

      rg.stdout?.on('data', (chunk: Buffer) => {
        stdoutBuf += chunk.toString()
        let nl: number
        while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
          const line = stdoutBuf.slice(0, nl)
          stdoutBuf = stdoutBuf.slice(nl + 1)
          if (!trim(line)) continue

          const result = parseLine(line)
          if (result) {
            results.push(result)
            if (onMatch) {
              try {
                onMatch(result)
              } catch {
                // ignore listener errors
              }
            }
          }

          if (results.length >= maxResults) {
            rg.kill()
            stop()
            return
          }
        }
      })

      rg.on('close', () => {
        if (stdoutBuf && trim(stdoutBuf)) {
          const result = parseLine(stdoutBuf)
          if (result) {
            results.push(result)
            if (onMatch) {
              try {
                onMatch(result)
              } catch {
                // ignore listener errors
              }
            }
          }
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

function parseLine(line: string): SearchTextResult | null {
  let parsed: RgJsonData
  try {
    parsed = JSON.parse(line) as RgJsonData
  } catch {
    return null
  }

  if (parsed.type !== 'match' || !parsed.data) return null
  const data = parsed.data

  const path = data.path?.text ?? decodeBytes(data.path?.bytes)
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

function decodeBytes(bytes?: string): string | undefined {
  if (!bytes) return undefined
  try {
    return Buffer.from(bytes, 'base64').toString('utf8')
  } catch {
    return undefined
  }
}
