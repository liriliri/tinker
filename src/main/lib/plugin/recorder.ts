import path from 'node:path'
import {
  IpcPluginRecorderError,
  IpcPluginRecorderStarted,
  IpcPluginRecorderStopped,
} from 'common/types'
import { WebContents } from 'electron'
import isEmpty from 'licia/isEmpty'
import isErr from 'licia/isErr'
import toStr from 'licia/toStr'
import { handleEvent } from 'share/main/lib/util'
import { pluginViews } from './view'

interface RecordingSession {
  pluginId: string
  filePath: string
  requestWebContents: WebContents
  stopping: boolean
  startedResolve: () => void
  startedReject: (err: Error) => void
  started: Promise<void>
  stoppedResolve: (filePath: string) => void
  stoppedReject: (err: Error) => void
  stopped: Promise<string>
  cleanup: () => void
}

const sessions = new Map<string, RecordingSession>()

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function toError(err: unknown) {
  return isErr(err) ? err : new Error(toStr(err))
}

function failSession(session: RecordingSession, err: Error) {
  sessions.delete(session.pluginId)
  session.startedReject(err)
  session.stoppedReject(err)
  session.cleanup()
}

function getSession(pluginId: string) {
  const session = sessions.get(pluginId)
  if (!session) {
    throw new Error(`Plugin is not recording: ${pluginId}`)
  }
  return session
}

export async function startPluginRecorder(pluginId: string, filePath: string) {
  if (isEmpty(filePath)) {
    throw new Error('Missing output path')
  }
  if (!path.isAbsolute(filePath)) {
    throw new Error('video-start currently requires an absolute output path')
  }
  if (sessions.has(pluginId)) {
    throw new Error(`Plugin is already recording: ${pluginId}`)
  }

  const entry = pluginViews[pluginId]
  if (!entry || entry.view.webContents.isDestroyed()) {
    throw new Error(`Plugin is not running: ${pluginId}`)
  }
  if (!entry.win || entry.win.isDestroyed()) {
    throw new Error('Video recording requires a visible plugin window')
  }

  const requestWebContents = entry.win.webContents
  const targetWebContents = entry.view.webContents
  const started = createDeferred<void>()
  const stopped = createDeferred<string>()

  const onDestroyed = () => {
    const session = sessions.get(pluginId)
    if (!session) return
    failSession(
      session,
      new Error('Recording window was destroyed before recording completed')
    )
  }

  requestWebContents.once('destroyed', onDestroyed)
  targetWebContents.once('destroyed', onDestroyed)

  const session: RecordingSession = {
    pluginId,
    filePath,
    requestWebContents,
    stopping: false,
    startedResolve: started.resolve,
    startedReject: started.reject,
    started: started.promise,
    stoppedResolve: stopped.resolve,
    stoppedReject: stopped.reject,
    stopped: stopped.promise,
    cleanup() {
      requestWebContents.off('destroyed', onDestroyed)
      targetWebContents.off('destroyed', onDestroyed)
    },
  }

  sessions.set(pluginId, session)

  try {
    const sourceId = targetWebContents.getMediaSourceId(requestWebContents)
    requestWebContents.send('pluginRecorderStart', {
      pluginId,
      filePath,
      sourceId,
    })
    await session.started
  } catch (err: unknown) {
    const error = toError(err)
    if (sessions.has(pluginId)) {
      failSession(session, error)
    }
    throw error
  }
}

export async function stopPluginRecorder(pluginId: string): Promise<string> {
  const session = getSession(pluginId)
  if (session.stopping) {
    return session.stopped
  }
  session.stopping = true
  if (session.requestWebContents.isDestroyed()) {
    const err = new Error('Recording window is unavailable')
    failSession(session, err)
    throw err
  }

  session.requestWebContents.send('pluginRecorderStop', { pluginId })
  return session.stopped
}

const pluginRecorderStarted: IpcPluginRecorderStarted = async function (
  pluginId
) {
  const session = getSession(pluginId)
  session.startedResolve()
}

const pluginRecorderStopped: IpcPluginRecorderStopped = async function (
  pluginId
) {
  const session = getSession(pluginId)
  sessions.delete(pluginId)
  session.cleanup()
  session.startedResolve()
  session.stoppedResolve(session.filePath)
}

const pluginRecorderError: IpcPluginRecorderError = async function (
  pluginId,
  message
) {
  const session = sessions.get(pluginId)
  if (!session) return
  failSession(session, new Error(message || 'Video recording failed'))
}

export function init() {
  handleEvent('pluginRecorderStarted', pluginRecorderStarted)
  handleEvent('pluginRecorderStopped', pluginRecorderStopped)
  handleEvent('pluginRecorderError', pluginRecorderError)
}
