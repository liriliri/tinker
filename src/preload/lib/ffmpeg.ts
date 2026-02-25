import { spawn, ChildProcess } from 'child_process'
import { stat } from 'fs/promises'
import ffmpegStatic from 'ffmpeg-static'
import uuid from 'licia/uuid'
import toNum from 'licia/toNum'
import { isDev } from 'share/common/util'

export interface VideoStream {
  codec: string
  width: number
  height: number
  fps: number
  bitrate?: number
  thumbnail: string
}

export interface AudioStream {
  codec: string
  sampleRate?: number
  bitrate?: number
}

export interface MediaInfo {
  /** in bytes */
  size: number
  duration: number
  videoStream?: VideoStream
  audioStream?: AudioStream
}

export interface RunProgress {
  bitrate: string
  fps: number
  frame: number
  percent?: number
  q: number | string
  size: number
  speed: string
  time: string
}

type ProgressCallback = (progress: RunProgress) => void

function parseSizeToBytes(size: string): number {
  const match = size.match(/^(\d+)(\w+)$/)
  if (!match) return 0
  const value = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  switch (unit) {
    case 'kb':
      return value * 1024
    case 'mb':
      return value * 1024 * 1024
    case 'gb':
      return value * 1024 * 1024 * 1024
    default:
      return value
  }
}

const regDuration = /Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/
const regProgress =
  /frame=\s*(\d+)\s+fps=\s*([\d.]+)\s+q=([\d.-]+)\s+L?size=\s*(\d+\w+)\s+time=(\d{2}):(\d{2}):(\d{2}\.\d{2})\s+bitrate=\s*([\d.]+\w+\/s)\s+speed=\s*([\d.]+x)/
const regVideoStream =
  /Stream[^\n]*?: Video: (\w+)[^\n]*?(\d{3,5})x(\d{3,5})[^\n]*?([\d.]+) fps/
const regVideoBitrate = /Stream[^\n]*?: Video:[^\n]*?(\d+) kb\/s/
const regAudioStream = /Stream[^\n]*?: Audio: (\w+)[^\n]*?(\d+) Hz/
const regAudioBitrate = /Stream[^\n]*?: Audio:[^\n]*?(\d+) kb\/s/

function getFFmpegPath(): string {
  let ffmpegPath = ffmpegStatic || ''
  if (!ffmpegPath) {
    throw new Error('FFmpeg binary not found')
  }
  if (!isDev()) {
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
  }
  return ffmpegPath
}

class FFmpegTask {
  private promise: Promise<void>
  private ffmpegProcess: ChildProcess | null = null

  constructor(args: string[], onProgress?: ProgressCallback) {
    const ffmpegPath = getFFmpegPath()

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
            size: parseSizeToBytes(size),
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

export async function getMediaInfo(filePath: string): Promise<MediaInfo> {
  const info = await new Promise<MediaInfo>((resolve, reject) => {
    const ffmpegPath = getFFmpegPath()
    const ffmpegProcess = spawn(ffmpegPath, ['-i', filePath])

    let stderrData = ''

    ffmpegProcess.stderr?.on('data', (data: Buffer) => {
      stderrData += data.toString()
    })

    ffmpegProcess.on('close', () => {
      const durationMatch = stderrData.match(regDuration)
      if (!durationMatch) {
        reject(new Error('Not a valid media file'))
        return
      }

      const hours = toNum(durationMatch[1])
      const minutes = toNum(durationMatch[2])
      const seconds = toNum(durationMatch[3])
      const duration = hours * 3600 + minutes * 60 + seconds

      const info: MediaInfo = { size: 0, duration }

      const videoMatch = stderrData.match(regVideoStream)
      if (videoMatch) {
        info.videoStream = {
          codec: videoMatch[1],
          width: toNum(videoMatch[2]),
          height: toNum(videoMatch[3]),
          fps: toNum(videoMatch[4]),
          thumbnail: '',
        }

        const videoBitrateMatch = stderrData.match(regVideoBitrate)
        if (videoBitrateMatch) {
          info.videoStream.bitrate = toNum(videoBitrateMatch[1])
        }
      }

      const audioMatch = stderrData.match(regAudioStream)
      if (audioMatch) {
        info.audioStream = {
          codec: audioMatch[1],
          sampleRate: toNum(audioMatch[2]),
        }

        const audioBitrateMatch = stderrData.match(regAudioBitrate)
        if (audioBitrateMatch) {
          info.audioStream.bitrate = toNum(audioBitrateMatch[1])
        }
      }

      resolve(info)
    })

    ffmpegProcess.on('error', (err) => {
      reject(err)
    })
  })

  info.size = (await stat(filePath)).size

  if (info.videoStream) {
    info.videoStream.thumbnail = await generateThumbnail(
      filePath,
      Math.min(1, info.duration / 2)
    )
  }

  return info
}

function generateThumbnail(
  filePath: string,
  seekTime: number
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const ffmpegProcess = spawn(getFFmpegPath(), [
      '-ss',
      String(seekTime),
      '-i',
      filePath,
      '-vframes',
      '1',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      'pipe:1',
    ])

    const chunks: Buffer[] = []

    ffmpegProcess.stdout?.on('data', (data: Buffer) => {
      chunks.push(data)
    })

    ffmpegProcess.on('close', () => {
      if (chunks.length === 0) {
        reject(new Error('Failed to generate thumbnail'))
        return
      }
      const buffer = Buffer.concat(chunks)
      resolve(`data:image/jpeg;base64,${buffer.toString('base64')}`)
    })

    ffmpegProcess.on('error', (err) => {
      reject(err)
    })
  })
}
