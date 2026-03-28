import fs from 'node:fs'
import path from 'node:path'

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

function resolvePath(filePath: string, workingDir: string): string {
  if (path.isAbsolute(filePath)) return filePath
  return path.resolve(workingDir, filePath)
}

export function readFile(
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
      .map((line, i) => `${start + i + 1}| ${line}`)
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
        : `\n\n(End of file - ${total} lines total)`
    return display + suffix
  } catch (e) {
    return `Error reading file: ${e instanceof Error ? e.message : String(e)}`
  }
}

export function writeFile(
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

export function editFile(
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

export function listDir(
  dirPath: string,
  workingDir: string,
  recursive = false,
  maxEntries?: number
): string {
  try {
    const resolved = resolvePath(dirPath, workingDir)
    if (!fs.existsSync(resolved)) {
      return `Error: Directory not found: ${dirPath}`
    }
    if (!fs.statSync(resolved).isDirectory()) {
      return `Error: Not a directory: ${dirPath}`
    }

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
