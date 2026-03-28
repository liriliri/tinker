import { contextBridge, shell } from 'electron'
import https from 'node:https'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import os from 'node:os'
import { webSearch } from '../../../share/tools/webImpl'
import type { WebSearchResult } from '../../../share/tools/web'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const MAX_REDIRECTS = 5
const EXEC_TIMEOUT_MS = 60_000
const FETCH_TIMEOUT_MS = 15_000
const MAX_OUTPUT_CHARS = 10_000
const MAX_FILE_CHARS = 128_000
const DEFAULT_LINE_LIMIT = 2000
const LIST_DIR_MAX = 200

const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  '__pycache__',
  '.venv',
  'venv',
  'dist',
  'build',
  '.tox',
  '.mypy_cache',
  '.pytest_cache',
])

const DENY_PATTERNS = [
  /\brm\s+-[rf]{1,2}\b/i,
  /\bdel\s+\/[fq]\b/i,
  /\brmdir\s+\/s\b/i,
  /(?:^|[;&|]\s*)format\b/i,
  /\b(mkfs|diskpart)\b/i,
  /\bdd\s+if=/i,
  />\s*\/dev\/sd/,
  /\b(shutdown|reboot|poweroff)\b/i,
  /:\(\)\s*\{.*\};\s*:/,
]

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function fetchHtml(url: string, redirectCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount >= MAX_REDIRECTS) {
      reject(new Error('Too many redirects'))
      return
    }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      reject(new Error(`Invalid URL: ${url}`))
      return
    }
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.get(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirectUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsed.protocol}//${parsed.host}${res.headers.location}`
          fetchHtml(redirectUrl, redirectCount + 1)
            .then(resolve)
            .catch(reject)
          res.resume()
          return
        }
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
        res.on('error', reject)
      }
    )
    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    req.on('error', reject)
  })
}

function decodeHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

const MAX_HTML_CHARS = 200_000

function htmlToText(html: string): string {
  const truncated =
    html.length > MAX_HTML_CHARS ? html.slice(0, MAX_HTML_CHARS) : html
  return stripTags(
    truncated
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<(nav|header|footer|aside)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  ).slice(0, 2000)
}

// ---------------------------------------------------------------------------
// exec
// ---------------------------------------------------------------------------

function guardCommand(command: string): string | null {
  const lower = command.trim().toLowerCase()
  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(lower)) {
      return 'Error: Command blocked by safety guard (dangerous pattern detected)'
    }
  }
  return null
}

async function execCommand(
  command: string,
  workingDir: string,
  timeout?: number
): Promise<string> {
  const guard = guardCommand(command)
  if (guard) return guard

  const effectiveTimeout = Math.min(timeout ?? EXEC_TIMEOUT_MS, 600_000)

  return new Promise((resolve) => {
    const proc = execFile(
      process.platform === 'win32' ? 'cmd' : 'sh',
      process.platform === 'win32' ? ['/c', command] : ['-c', command],
      {
        cwd: workingDir,
        timeout: effectiveTimeout,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        const parts: string[] = []
        if (stdout) parts.push(stdout)
        if (stderr) parts.push(`STDERR:\n${stderr}`)
        if (error?.killed) {
          parts.push(`\nError: Command timed out after ${effectiveTimeout}ms`)
        } else {
          parts.push(`\nExit code: ${error ? error.code ?? 1 : 0}`)
        }
        let result = parts.join('\n') || '(no output)'
        if (result.length > MAX_OUTPUT_CHARS) {
          const half = MAX_OUTPUT_CHARS / 2
          result =
            result.slice(0, half) +
            `\n\n... (${
              result.length - MAX_OUTPUT_CHARS
            } chars truncated) ...\n\n` +
            result.slice(-half)
        }
        resolve(result)
      }
    )
    void proc
  })
}

// ---------------------------------------------------------------------------
// filesystem
// ---------------------------------------------------------------------------

function resolvePath(filePath: string, workingDir: string): string {
  if (path.isAbsolute(filePath)) return filePath
  return path.resolve(workingDir, filePath)
}

function readFile(
  filePath: string,
  workingDir: string,
  offset = 1,
  limit?: number
): string {
  try {
    const resolved = resolvePath(filePath, workingDir)
    if (!fs.existsSync(resolved)) return `Error: File not found: ${filePath}`
    if (!fs.statSync(resolved).isFile()) return `Error: Not a file: ${filePath}`
    const text = fs.readFileSync(resolved, 'utf-8')
    const lines = text.split('\n')
    const total = lines.length
    const start = Math.max(0, offset - 1)
    const end = Math.min(start + (limit ?? DEFAULT_LINE_LIMIT), total)
    const numbered = lines
      .slice(start, end)
      .map((l, i) => `${start + i + 1}| ${l}`)
      .join('\n')
    const display =
      numbered.length > MAX_FILE_CHARS
        ? numbered.slice(0, MAX_FILE_CHARS) + '\n...(truncated)'
        : numbered
    const suffix =
      end < total
        ? `\n\n(Showing lines ${offset}-${end} of ${total}. Use offset=${
            end + 1
          } to continue.)`
        : `\n\n(End of file — ${total} lines total)`
    return display + suffix
  } catch (e) {
    return `Error reading file: ${e instanceof Error ? e.message : String(e)}`
  }
}

function writeFile(
  filePath: string,
  content: string,
  workingDir: string
): string {
  try {
    const resolved = resolvePath(filePath, workingDir)
    fs.mkdirSync(path.dirname(resolved), { recursive: true })
    fs.writeFileSync(resolved, content, 'utf-8')
    return `Successfully wrote ${content.length} bytes to ${resolved}`
  } catch (e) {
    return `Error writing file: ${e instanceof Error ? e.message : String(e)}`
  }
}

function editFile(
  filePath: string,
  oldText: string,
  newText: string,
  workingDir: string,
  replaceAll = false
): string {
  try {
    const resolved = resolvePath(filePath, workingDir)
    if (!fs.existsSync(resolved)) return `Error: File not found: ${filePath}`
    let content = fs.readFileSync(resolved, 'utf-8')
    if (!content.includes(oldText)) {
      return `Error: old_text not found in ${filePath}. Verify the file content.`
    }
    const count = content.split(oldText).length - 1
    if (count > 1 && !replaceAll) {
      return `Warning: old_text appears ${count} times. Provide more context or set replace_all=true.`
    }
    content = replaceAll
      ? content.split(oldText).join(newText)
      : content.replace(oldText, newText)
    fs.writeFileSync(resolved, content, 'utf-8')
    return `Successfully edited ${resolved}`
  } catch (e) {
    return `Error editing file: ${e instanceof Error ? e.message : String(e)}`
  }
}

function listDir(
  dirPath: string,
  workingDir: string,
  recursive = false,
  maxEntries?: number
): string {
  try {
    const resolved = resolvePath(dirPath, workingDir)
    if (!fs.existsSync(resolved))
      return `Error: Directory not found: ${dirPath}`
    if (!fs.statSync(resolved).isDirectory())
      return `Error: Not a directory: ${dirPath}`
    const cap = maxEntries ?? LIST_DIR_MAX
    const items: string[] = []
    let total = 0

    if (recursive) {
      function walk(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (IGNORE_DIRS.has(entry.name)) continue
          const full = path.join(dir, entry.name)
          const rel = path.relative(resolved, full)
          total++
          if (items.length < cap) {
            items.push(entry.isDirectory() ? rel + '/' : rel)
          }
          if (entry.isDirectory()) walk(full)
        }
      }
      walk(resolved)
    } else {
      const entries = fs
        .readdirSync(resolved, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
      for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) continue
        total++
        if (items.length < cap) {
          items.push(
            entry.isDirectory() ? `📁 ${entry.name}` : `📄 ${entry.name}`
          )
        }
      }
    }

    if (total === 0) return `Directory ${dirPath} is empty`
    let result = items.join('\n')
    if (total > cap) {
      result += `\n\n(truncated, showing first ${cap} of ${total} entries)`
    }
    return result
  } catch (e) {
    return `Error listing directory: ${
      e instanceof Error ? e.message : String(e)
    }`
  }
}

// ---------------------------------------------------------------------------
// web fetch
// ---------------------------------------------------------------------------

async function webFetch(url: string): Promise<string> {
  try {
    const html = await fetchHtml(url)
    const text = htmlToText(html)
    if (!text) return `Error: Could not extract content from ${url}`
    return `[Content from ${url}]\n\n${text}`
  } catch (e) {
    return `Error fetching ${url}: ${
      e instanceof Error ? e.message : String(e)
    }`
  }
}

// ---------------------------------------------------------------------------
// contextBridge
// ---------------------------------------------------------------------------

const aiAssistantObj = {
  openExternal(url: string): void {
    shell.openExternal(url)
  },
  getHomeDir(): string {
    return os.homedir()
  },
  getSystemInfo(): { platform: string; arch: string } {
    const system = os.type()
    const platform =
      system === 'Darwin'
        ? 'macOS'
        : system === 'Windows_NT'
        ? 'Windows'
        : system
    return { platform: `${platform} ${os.arch()}`, arch: os.arch() }
  },
  exec(command: string, workingDir: string, timeout?: number): Promise<string> {
    return execCommand(command, workingDir, timeout)
  },
  readFile(
    filePath: string,
    workingDir: string,
    offset?: number,
    limit?: number
  ): string {
    return readFile(filePath, workingDir, offset, limit)
  },
  writeFile(filePath: string, content: string, workingDir: string): string {
    return writeFile(filePath, content, workingDir)
  },
  editFile(
    filePath: string,
    oldText: string,
    newText: string,
    workingDir: string,
    replaceAll?: boolean
  ): string {
    return editFile(filePath, oldText, newText, workingDir, replaceAll)
  },
  listDir(
    dirPath: string,
    workingDir: string,
    recursive?: boolean,
    maxEntries?: number
  ): string {
    return listDir(dirPath, workingDir, recursive, maxEntries)
  },
  webSearch(query: string): Promise<WebSearchResult[]> {
    return webSearch(query)
  },
  webFetch(url: string): Promise<string> {
    return webFetch(url)
  },
}

contextBridge.exposeInMainWorld('aiAssistant', aiAssistantObj)

declare global {
  const aiAssistant: typeof aiAssistantObj
}
