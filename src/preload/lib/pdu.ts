import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import contain from 'licia/contain'
import isWindows from 'licia/isWindows'
import uuid from 'licia/uuid'
import toNum from 'licia/toNum'
import { isDev } from 'share/common/util'

export interface DiskUsageOptions {
  paths: string[]
  maxDepth?: number
  quantity?: 'apparent-size' | 'block-size' | 'block-count'
  minRatio?: number
  silentErrors?: boolean
  threads?: number
  deduplicateHardlinks?: boolean
}

export interface DiskUsageProgress {
  items: number
  total: number
  errors: number
}

export interface DiskUsageResult {
  name: string
  size: number
  children: DiskUsageResult[]
}

type ProgressCallback = (progress: DiskUsageProgress) => void

function getPduPath(): string {
  const name = isWindows ? 'pdu.exe' : 'pdu'

  if (isDev()) {
    return path.resolve(__dirname, '../../', `resources/${name}`)
  }

  const ret = path.resolve(__dirname, '../', `resources/${name}`)
  if (contain(ret, 'app.asar')) {
    return path.resolve(process.resourcesPath, name)
  }

  return ret
}

const regProgress = /\(scanned (\d+), total (\d+)(?:, erred (\d+))?\)/

class PduTask {
  private promise: Promise<DiskUsageResult>
  private pduProcess: ChildProcess | null = null

  constructor(options: DiskUsageOptions, onProgress?: ProgressCallback) {
    const pduPath = getPduPath()
    const args = this.buildArgs(options, !!onProgress)

    let lastProgressTime = 0

    this.promise = new Promise<DiskUsageResult>((resolve, reject) => {
      this.pduProcess = spawn(pduPath, args)

      let stdoutData = ''
      let stderrData = ''

      this.pduProcess.stdout?.on('data', (data: Buffer) => {
        stdoutData += data.toString()
      })

      this.pduProcess.stderr?.on('data', (data: Buffer) => {
        stderrData += data.toString()

        if (onProgress) {
          const now = Date.now()
          if (now - lastProgressTime < 100) {
            return
          }
          lastProgressTime = now

          const match = stderrData.match(regProgress)
          if (match) {
            onProgress({
              items: toNum(match[1]),
              total: toNum(match[2]),
              errors: match[3] ? toNum(match[3]) : 0,
            })
          }
        }

        if (stderrData.length > 2048) {
          stderrData = stderrData.slice(-2048)
        }
      })

      this.pduProcess.on('close', (code) => {
        if (code === 0 || stdoutData) {
          try {
            const result = JSON.parse(stdoutData)
            resolve(result.tree)
          } catch {
            reject(new Error('Failed to parse pdu output'))
          }
        } else {
          reject(new Error(`pdu process exited with code ${code}`))
        }
      })

      this.pduProcess.on('error', (err) => {
        reject(err)
      })
    })
  }

  private buildArgs(options: DiskUsageOptions, progress: boolean): string[] {
    const args: string[] = ['--json-output']

    if (progress) {
      args.push('--progress')
    }

    if (options.maxDepth !== undefined) {
      args.push('--max-depth', String(options.maxDepth))
    }

    if (options.quantity) {
      args.push('--quantity', options.quantity)
    }

    if (options.minRatio !== undefined) {
      args.push('--min-ratio', String(options.minRatio))
    }

    if (options.silentErrors) {
      args.push('--silent-errors')
    }

    if (options.threads !== undefined) {
      args.push('--threads', String(options.threads))
    }

    if (options.deduplicateHardlinks) {
      args.push('--deduplicate-hardlinks')
    }

    args.push(...options.paths)

    return args
  }

  getPromise(): Promise<DiskUsageResult> {
    return this.promise
  }

  kill(): void {
    if (this.pduProcess && !this.pduProcess.killed) {
      this.pduProcess.kill('SIGKILL')
    }
  }

  quit(): void {
    if (this.pduProcess && !this.pduProcess.killed) {
      this.pduProcess.kill('SIGTERM')
    }
  }
}

class PduTaskManager {
  private tasks = new Map<string, PduTask>()

  run(
    options: DiskUsageOptions,
    onProgress?: ProgressCallback
  ): {
    promise: Promise<DiskUsageResult>
    taskId: string
  } {
    const taskId = uuid()
    const task = new PduTask(options, onProgress)
    this.tasks.set(taskId, task)

    const promise = task.getPromise().finally(() => {
      this.tasks.delete(taskId)
    })

    return { promise, taskId }
  }

  kill(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (task) {
      task.kill()
    }
  }

  quit(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (task) {
      task.quit()
    }
  }
}

const pduManager = new PduTaskManager()

export function getDiskUsage(
  options: DiskUsageOptions,
  onProgress?: ProgressCallback
): { promise: Promise<DiskUsageResult>; taskId: string } {
  return pduManager.run(options, onProgress)
}

export function killDiskUsage(taskId: string): void {
  pduManager.kill(taskId)
}

export function quitDiskUsage(taskId: string): void {
  pduManager.quit(taskId)
}
