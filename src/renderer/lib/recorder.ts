import { setWebmDuration } from './webm'
import $css from 'licia/$css'
import $insert from 'licia/$insert'
import $remove from 'licia/$remove'
import each from 'licia/each'
import find from 'licia/find'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import max from 'licia/max'
import now from 'licia/now'
import once from 'licia/once'
import toStr from 'licia/toStr'

interface StartPayload {
  pluginId: string
  filePath: string
  sourceId: string
}

interface StopPayload {
  pluginId: string
}

interface ActiveRecorder {
  pluginId: string
  filePath: string
  stream: MediaStream
  recorder: MediaRecorder
  video: HTMLVideoElement
  chunks: Blob[]
  startedAt: number
  stopping: boolean
  finished: boolean
}

const recorders = new Map<string, ActiveRecorder>()

const MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

function errMessage(err: unknown, fallback = '') {
  if (isErr(err)) return err.message
  return toStr(err) || fallback
}

function stopTracks(stream: MediaStream) {
  each(stream.getTracks(), (track) => track.stop())
}

function disposeRecorder(active: ActiveRecorder) {
  stopTracks(active.stream)
  active.video.srcObject = null
  $remove(active.video)
  recorders.delete(active.pluginId)
}

async function flushRecorder(active: ActiveRecorder) {
  const blob = new Blob(active.chunks, {
    type: active.recorder.mimeType || 'video/webm',
  })
  const bytes = new Uint8Array(await blob.arrayBuffer())
  await node.writeFile(
    active.filePath,
    setWebmDuration(bytes, max(0, now() - active.startedAt))
  )
}

async function playStream(stream: MediaStream) {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = stream
  $css(video, {
    position: 'fixed',
    left: '-9999px',
    width: '1px',
    height: '1px',
  })
  $insert.append(document.documentElement, video)
  await video.play()
  return video
}

async function startRecorder({ pluginId, filePath, sourceId }: StartPayload) {
  if (recorders.has(pluginId)) {
    throw new Error(`Plugin is already recording: ${pluginId}`)
  }

  const mimeType = find(MIME_TYPES, (type) =>
    MediaRecorder.isTypeSupported(type)
  )
  if (!mimeType) {
    throw new Error('No supported MediaRecorder video type')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: sourceId,
        maxWidth: 1920,
        maxHeight: 1080,
      },
    } as MediaTrackConstraints,
  })

  let video: HTMLVideoElement
  try {
    video = await playStream(stream)
  } catch (err) {
    stopTracks(stream)
    throw err
  }

  const recorder = new MediaRecorder(stream, { mimeType })
  const active: ActiveRecorder = {
    pluginId,
    filePath,
    stream,
    recorder,
    video,
    chunks: [],
    startedAt: now(),
    stopping: false,
    finished: false,
  }
  recorders.set(pluginId, active)

  let firstChunk: (() => void) | undefined
  let failFirstChunk: ((err: Error) => void) | undefined
  const firstChunkReady = new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Timed out waiting for recorded video frames'))
    }, 5000)
    firstChunk = once(() => {
      window.clearTimeout(timer)
      resolve()
    })
    failFirstChunk = once((err: Error) => {
      window.clearTimeout(timer)
      reject(err)
    })
  })

  recorder.ondataavailable = (event) => {
    if (event.data.size === 0) return
    active.chunks.push(event.data)
    firstChunk?.()
  }
  recorder.onerror = () => {
    failFirstChunk?.(new Error('MediaRecorder failed'))
    if (active.finished) return
    active.finished = true
    void main.pluginRecorderError(pluginId, 'MediaRecorder failed')
    disposeRecorder(active)
  }
  recorder.onstop = () => {
    if (active.finished) return
    active.finished = true
    void (async () => {
      try {
        if (!active.stopping || isEmpty(active.chunks)) {
          throw new Error('MediaRecorder stopped before any video was captured')
        }
        await flushRecorder(active)
        await main.pluginRecorderStopped(pluginId)
      } catch (err: unknown) {
        await main.pluginRecorderError(pluginId, errMessage(err))
      } finally {
        disposeRecorder(active)
      }
    })()
  }

  recorder.start(200)
  await firstChunkReady
  await main.pluginRecorderStarted(pluginId)
}

function stopRecorder({ pluginId }: StopPayload) {
  const active = recorders.get(pluginId)
  if (!active) {
    void main.pluginRecorderError(
      pluginId,
      `Plugin is not recording: ${pluginId}`
    )
    return
  }
  active.stopping = true
  if (active.recorder.state !== 'inactive') {
    active.recorder.stop()
  }
}

main.on('pluginRecorderStart', (payload: StartPayload) => {
  void startRecorder(payload).catch((err: unknown) => {
    const active = recorders.get(payload.pluginId)
    if (active) {
      active.finished = true
      if (active.recorder.state !== 'inactive') {
        active.recorder.stop()
      }
      disposeRecorder(active)
    }
    void main.pluginRecorderError(
      payload.pluginId,
      errMessage(err, 'Failed to start recording')
    )
  })
})

main.on('pluginRecorderStop', (payload: StopPayload) => {
  stopRecorder(payload)
})
