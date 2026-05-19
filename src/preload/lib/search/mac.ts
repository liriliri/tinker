import { spawn, ChildProcess } from 'child_process'
import trim from 'licia/trim'
import startWith from 'licia/startWith'
import toInt from 'licia/toInt'
import map from 'licia/map'
import { SearchFileResult } from './index'

export function searchFile(
  query: string,
  offset: number,
  maxResults: number,
  dirs?: string[],
  exts?: string[]
): { process: ChildProcess; promise: Promise<SearchFileResult[]> } {
  const args: string[] = []

  if (dirs && dirs.length > 0) {
    for (const dir of dirs) {
      args.push('-onlyin', dir)
    }
  }

  if (exts && exts.length > 0) {
    const extConditions = map(exts, (ext) => `kMDItemFSName == "*.${ext}"`)
    const extQuery = `(${extConditions.join(
      ' || '
    )}) && kMDItemFSName == "*${query}*"cd`
    args.push(extQuery)
  } else {
    args.push('-name', query)
  }

  args.push(
    '-0',
    '-attr',
    'kMDItemFSSize',
    '-attr',
    'kMDItemFSContentChangeDate'
  )

  const mdfindProcess = spawn('mdfind', args)
  const results: SearchFileResult[] = []
  const target = offset + maxResults
  let buffer = ''

  const promise = new Promise<SearchFileResult[]>((resolve) => {
    mdfindProcess.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString()

      // Process complete entries separated by null byte
      let nullIndex: number
      while ((nullIndex = buffer.indexOf('\0')) !== -1) {
        const entry = buffer.slice(0, nullIndex)
        buffer = buffer.slice(nullIndex + 1)

        if (!entry || !trim(entry)) continue

        const result = parseEntry(entry)
        if (result) {
          results.push(result)
        }

        // Kill the process early once we have enough results
        if (results.length >= target) {
          mdfindProcess.kill()
          resolve(results.slice(offset, target))
          return
        }
      }
    })

    mdfindProcess.on('close', () => {
      // Process any remaining data in the buffer
      if (buffer && trim(buffer)) {
        const result = parseEntry(buffer)
        if (result) {
          results.push(result)
        }
      }
      resolve(results.slice(offset, target))
    })

    mdfindProcess.on('error', () => {
      resolve([])
    })
  })

  return { process: mdfindProcess, promise }
}

function parseEntry(entry: string): SearchFileResult | null {
  const parts = entry.split(/\s+(?=kMD)/)
  const filePath = trim(parts[0])
  if (!filePath) return null

  let size = 0
  let dateModified = 0

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]
    if (startWith(part, 'kMDItemFSSize')) {
      const val = extractAttrValue(part)
      size = val !== null ? toInt(val) : 0
    } else if (startWith(part, 'kMDItemFSContentChangeDate')) {
      const val = extractAttrValue(part)
      dateModified = val !== null ? new Date(val).getTime() || 0 : 0
    }
  }

  return { path: filePath, size, dateModified }
}

function extractAttrValue(attr: string): string | null {
  const eqIndex = attr.indexOf(' = ')
  if (eqIndex === -1) return null
  const val = trim(attr.slice(eqIndex + 3))
  return val === '(null)' ? null : val
}
