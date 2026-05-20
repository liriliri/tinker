import { spawn, exec, ChildProcess } from 'child_process'
import { pathExists, mkdirs, writeFile } from 'fs-extra'
import { join } from 'path'
import trim from 'licia/trim'
import sleep from 'licia/sleep'
import map from 'licia/map'
import mainObj from 'share/preload/main'
import { resolveResources } from '../util'
import { SearchFileResult } from './index'

const esPath = resolveResources('everything/es.exe')
const everythingPath = resolveResources('everything/everything.exe')

function isEverythingReady(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(
      `"${esPath}" -get-everything-version`,
      { windowsHide: true },
      (error, stdout) => {
        resolve(!error && trim(stdout).length > 0)
      }
    )
  })
}

async function ensureEverythingRunning(): Promise<void> {
  const ready = await isEverythingReady()
  if (ready) return

  const userData: string = await mainObj.getPath('userData')
  const dataDir = join(userData, 'data/everything')
  const iniPath = join(dataDir, 'Everything.ini')

  if (!(await pathExists(iniPath))) {
    await mkdirs(dataDir)
    await writeFile(iniPath, '[Everything]\r\nshow_tray_icon=0\r\n')
  }

  exec(
    `powershell -Command "Start-Process -FilePath '${everythingPath}' -ArgumentList '-startup','-config','${iniPath}' -WindowStyle Hidden"`,
    { windowsHide: true }
  )

  for (let i = 0; i < 30; i++) {
    await sleep(1000)
    if (await isEverythingReady()) return
  }
}

function escapeForCmd(str: string): string {
  return str.replace(/([\\&|><^])/g, '^$1')
}

// Convert Windows FILETIME (100ns since 1601-01-01) to Unix timestamp (ms)
function filetimeToTimestamp(filetime: number): number {
  return Math.floor(filetime / 10000) - 11644473600000
}

export async function searchFile(
  query: string,
  offset: number,
  maxResults: number,
  dirs?: string[],
  exts?: string[]
): Promise<{ process: ChildProcess; promise: Promise<SearchFileResult[]> }> {
  await ensureEverythingRunning()

  const escaped = escapeForCmd(query)
  const args = [
    '-json',
    '-size',
    '-date-modified',
    '-offset',
    String(offset),
    '-max-results',
    String(maxResults),
  ]

  if (dirs && dirs.length > 0) {
    for (const dir of dirs) {
      args.push('-parent-path', dir)
    }
  }

  args.push(escaped)

  if (exts && exts.length > 0) {
    args.push(`ext:${exts.join(';')}`)
  }

  const esProcess = spawn(esPath, args, { windowsHide: true })
  let stdoutData = ''

  const promise = new Promise<SearchFileResult[]>((resolve) => {
    esProcess.stdout?.on('data', (data: Buffer) => {
      stdoutData += data.toString()
    })

    esProcess.on('close', () => {
      try {
        const items = JSON.parse(stdoutData)
        const results: SearchFileResult[] = map(items, (item: any) => ({
          path: item.filename,
          size: item.size || 0,
          dateModified: filetimeToTimestamp(item.date_modified),
        }))
        resolve(results)
      } catch {
        resolve([])
      }
    })

    esProcess.on('error', () => {
      resolve([])
    })
  })

  return { process: esProcess, promise }
}
