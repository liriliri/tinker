import Tracing from 'licia/Tracing'
import fs from 'fs-extra'
import path from 'path'
import log from 'share/common/log'
import { logsDir } from './log'

declare global {
  var __startupTracer: Tracing | undefined
}

const logger = log('tracing')

const CAT = 'startup'

const startedInBootstrap = !!global.__startupTracer
const tracer =
  global.__startupTracer ||
  new Tracing({
    processName: 'tinker-main',
    threadName: 'main',
  })

let finished = false
let loadPageId: string | null = null
let resolveFirstShow: (() => void) | null = null
const firstShow = new Promise<void>((resolve) => {
  resolveFirstShow = resolve
})

if (!startedInBootstrap) {
  tracer.start(CAT)
  tracer.begin(CAT, 'imports')
}

function ensureActive() {
  return !finished
}

export function markImportsDone() {
  if (!ensureActive()) {
    return
  }
  tracer.end()
}

export function begin(name: string, args?: any) {
  if (!ensureActive()) {
    return
  }
  tracer.begin(CAT, name, args)
}

export function end(args?: any) {
  if (!ensureActive()) {
    return
  }
  tracer.end(args)
}

export function instant(name: string, args?: any) {
  if (!ensureActive()) {
    return
  }
  tracer.instant(CAT, name, 't', args)
}

export function asyncBegin(name: string, args?: any) {
  if (!ensureActive()) {
    return ''
  }
  return tracer.asyncBegin(CAT, name, undefined, args)
}

export function asyncEnd(id: string, args?: any) {
  if (!ensureActive() || !id) {
    return
  }
  tracer.asyncEnd(id, args)
}

export function beginLoadPage() {
  loadPageId = asyncBegin('loadPage')
}

export function notifyFirstShow() {
  if (loadPageId) {
    asyncEnd(loadPageId)
    loadPageId = null
  }
  instant('first-show')
  resolveFirstShow?.()
  resolveFirstShow = null
}

export function finishAfter(...pending: Array<Promise<unknown>>) {
  Promise.all(pending).finally(() => finish())
}

export function waitFirstShow() {
  return firstShow
}

async function finish() {
  if (finished) {
    return
  }
  finished = true
  if (loadPageId) {
    tracer.asyncEnd(loadPageId)
    loadPageId = null
  }
  const events = tracer.stop()
  const filePath = path.join(logsDir, 'startup-trace.json')
  try {
    await fs.writeJSON(filePath, events)
    logger.info('startup trace written', filePath)
  } catch (err) {
    logger.warn('failed to write startup trace', err)
  }
}
