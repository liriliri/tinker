import { spawn, ChildProcess } from 'child_process'
import ffmpegStatic from 'ffmpeg-static'
import uuid from 'licia/uuid'
import toNum from 'licia/toNum'
import { isDev } from 'share/common/util'

export interface RunProgress {
  bitrate: string
  fps: number
  frame: number
  percent?: number
  q: number | string
  size: string
  speed: string
  time: string
}

type ProgressCallback = (progress: RunProgress) => void

const regDuration = /Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/
const regProgress =
  /frame=\s*(\d+)\s+fps=\s*([\d.]+)\s+q=([\d.-]+)\s+(?:L?size|Lsize)=\s*(\d+\w+)\s+time=(\d{2}):(\d{2}):(\d{2}\.\d{2})\s+bitrate=\s*([\d.]+\w+\/s)\s+speed=\s*([\d.]+x)/

class FFmpegTask {
  private promise: Promise<void>
  private ffmpegProcess: ChildProcess | null = null

  constructor(args: string[], onProgress?: ProgressCallback) {
    let ffmpegPath = ffmpegStatic || ''
    if (!ffmpegPath) {
      throw new Error('FFmpeg binary not found')
    }
    if (!isDev()) {
      ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
    }

    let duration = 0
    let lastProgressTime = 0

    this.promise = new Promise<void>((resolve, reject) => {
      this.ffmpegProcess = spawn(ffmpegPath, args)

      let stderrData = ''

      this.ffmpegProcess.stderr?.on('data', (data: Buffer) => {
        stderrData += data.toString()

        if (duration === 0) {
          const durationMatch = stderrData.match(regDuration)
          if (durationMatch) {
            const hours = toNum(durationMatch[1])
            const minutes = toNum(durationMatch[2])
            const seconds = toNum(durationMatch[3])
            duration = hours * 3600 + minutes * 60 + seconds
          }
        }

        const progressMatch = stderrData.match(regProgress)

        if (progressMatch && onProgress) {
          const now = Date.now()
          if (now - lastProgressTime < 100) {
            return
          }
          lastProgressTime = now

          const [, frame, fps, q, size, timeH, timeM, timeS, bitrate, speed] =
            progressMatch
          const currentTime =
            toNum(timeH) * 3600 + toNum(timeM) * 60 + toNum(timeS)

          let percent = 0
          if (duration > 0) {
            percent = Math.min(100, (currentTime / duration) * 100)
          }

          const qValue = toNum(q)
          const progress: RunProgress = {
            percent: Math.round(percent * 100) / 100,
            frame: toNum(frame),
            fps: toNum(fps),
            q: isNaN(qValue) ? q : qValue,
            size,
            time: `${timeH}:${timeM}:${timeS}`,
            bitrate,
            speed,
          }

          onProgress(progress)
        }

        if (stderrData.length > 2048) {
          stderrData = stderrData.slice(-2048)
        }
      })

      this.ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`))
        }
      })

      this.ffmpegProcess.on('error', (err) => {
        reject(err)
      })
    })
  }

  getPromise(): Promise<void> {
    return this.promise
  }

  kill(): void {
    if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
      this.ffmpegProcess.kill('SIGKILL')
    }
  }

  quit(): void {
    if (this.ffmpegProcess && !this.ffmpegProcess.killed) {
      this.ffmpegProcess.kill('SIGTERM')
    }
  }
}

class FFmpegTaskManager {
  private tasks = new Map<string, FFmpegTask>()

  run(
    args: string[],
    onProgress?: ProgressCallback
  ): {
    promise: Promise<void>
    taskId: string
  } {
    const taskId = uuid()
    const task = new FFmpegTask(args, onProgress)
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

const ffmpegManager = new FFmpegTaskManager()

export function runFFmpeg(
  args: string[],
  onProgress?: ProgressCallback
): { promise: Promise<void>; taskId: string } {
  return ffmpegManager.run(args, onProgress)
}

export function killFFmpeg(taskId: string): void {
  ffmpegManager.kill(taskId)
}

export function quitFFmpeg(taskId: string): void {
  ffmpegManager.quit(taskId)
}
