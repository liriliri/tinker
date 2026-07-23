import { spawn, ChildProcess } from 'child_process'
import pduPath from 'pdu-static'
import uuid from 'licia/uuid'
import toNum from 'licia/toNum'
import { isDev } from 'share/common/util'

export interface DiskUsageOptions {
  paths: string[]
  /**
   * Maximum depth to request from `pdu`.
   * `0` is accepted here and normalized to a valid `pdu` depth.
   */
  maxDepth?: number
  quantity?: 'apparent-size' | 'block-size' | 'block-count'
  minRatio?: number
  silentErrors?: boolean
  threads?: number
  deduplicateHardlinks?: boolean
}

export interface DiskUsageProgress {
  count: number
  size: number
  errors: number
}

export interface DiskUsageResult {
  name: string
  size: number
  children: DiskUsageResult[]
}

type ProgressCallback = (progress: DiskUsageProgress) => void

function getPduPath(): string {
  let path = pduPath || ''
  if (!path) {
    throw new Error('pdu binary not found')
  }
  if (!isDev()) {
    path = path.replace('app.asar', 'app.asar.unpacked')
  }
  return path
}

const regProgress = /\(scanned (\d+), total (\d+)(?:, erred (\d+))?\)/

class PduTask {
  private promise: Promise<DiskUsageResult>
  private pduProcess: ChildProcess | null = null

  constructor(options: DiskUsageOptions, onProgress?: ProgressCallback) {
    const args = this.buildArgs(options, !!onProgress)

    let lastProgressTime = 0

    this.promise = new Promise<DiskUsageResult>((resolve, reject) => {
      this.pduProcess = spawn(getPduPath(), args)

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
              count: toNum(match[1]),
              size: toNum(match[2]),
              errors: match[3] ? toNum(match[3]) : 0,
            })
          }
        }

        if (stderrData.length > 2048) {
          stderrData = stderrData.slice(-2048)
        }
      })

      this.pduProcess.on('close', (code, signal) => {
        if (code === 0 || stdoutData) {
          try {
            const result = JSON.parse(stdoutData)
            resolve(result.tree)
          } catch {
            reject(
              new Error(
                this.buildFailureMessage(
                  'Failed to parse pdu output',
                  code,
                  signal,
                  stderrData
                )
              )
            )
          }
        } else {
          reject(
            new Error(
              this.buildFailureMessage(
                'pdu process failed',
                code,
                signal,
                stderrData
              )
            )
          )
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

    const maxDepth = this.normalizeMaxDepth(options.maxDepth)
    if (maxDepth !== undefined) {
      args.push('--max-depth', String(maxDepth))
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

  private normalizeMaxDepth(maxDepth?: number): number | undefined {
    if (maxDepth === undefined) {
      return undefined
    }

    return maxDepth <= 0 ? 1 : maxDepth
  }

  private buildFailureMessage(
    prefix: string,
    code: number | null,
    signal: NodeJS.Signals | null,
    stderrData: string
  ): string {
    const details: string[] = []
    if (code !== null) {
      details.push(`code ${code}`)
    }
    if (signal) {
      details.push(`signal ${signal}`)
    }

    const stderr = stderrData.trim()
    if (stderr) {
      details.push(stderr)
    }

    return details.length > 0 ? `${prefix}: ${details.join('; ')}` : prefix
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
