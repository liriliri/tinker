import fixWebmDuration from 'fix-webm-duration'
import each from 'licia/each'
import find from 'licia/find'
import max from 'licia/max'
import now from 'licia/now'

const MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

const VIDEO_BITS_PER_SECOND = 16_000_000

function pickMimeType() {
  return (
    find(MIME_TYPES, (type) => MediaRecorder.isTypeSupported(type)) ||
    'video/webm'
  )
}

export default class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stream: MediaStream | null = null
  private startedAt = 0

  getStream() {
    return this.stream
  }

  async start(sourceId: string): Promise<void> {
    this.dispose()

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          maxWidth: 3840,
          maxHeight: 2160,
          maxFrameRate: 60,
        },
      } as MediaTrackConstraints,
    })

    const mimeType = pickMimeType()
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType,
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
    })
    this.chunks = []
    this.startedAt = now()

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.start(200)
  }

  async stop(): Promise<Blob> {
    const recorder = this.mediaRecorder
    if (!recorder) {
      throw new Error('No media recorder')
    }

    const mimeType = recorder.mimeType || 'video/webm'
    const durationMs = max(0, now() - this.startedAt)

    const makeBlob = () => new Blob(this.chunks, { type: mimeType })

    const raw = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        resolve(makeBlob())
      }
      recorder.onerror = () => {
        reject(new Error('Recording error'))
      }

      if (recorder.state !== 'inactive') {
        try {
          recorder.requestData()
        } catch {
          // ignore
        }
        recorder.stop()
      } else {
        resolve(makeBlob())
      }
    })

    this.mediaRecorder = null

    return fixWebmDuration(raw, durationMs, { logger: false })
  }

  dispose() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {
        // ignore
      }
    }
    this.mediaRecorder = null

    if (this.stream) {
      each(this.stream.getTracks(), (track) => track.stop())
      this.stream = null
    }

    this.chunks = []
    this.startedAt = 0
  }
}
