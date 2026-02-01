import { arrayBufferToBase64 } from './base64'

type Base64WorkerRequest =
  | {
      type: 'file'
      id: number
      file: File
    }
  | {
      type: 'bytes'
      id: number
      buffer: ArrayBuffer
    }

type Base64WorkerResult = {
  type: 'result'
  id: number
  base64: string
}

type Base64WorkerError = {
  type: 'error'
  id: number
  error: string
}

type WorkerResponse = Base64WorkerResult | Base64WorkerError

let base64Worker: Worker | null = null
let workerRequestId = 0
const workerPromises: Map<
  number,
  {
    resolve: (value: string) => void
    reject: (reason?: unknown) => void
  }
> = new Map()

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null

  if (!base64Worker) {
    base64Worker = new Worker(new URL('./base64.worker.ts', import.meta.url), {
      type: 'module',
    })

    base64Worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data
      const pending = workerPromises.get(data.id)

      if (!pending) return
      workerPromises.delete(data.id)

      if (data.type === 'result') {
        pending.resolve(data.base64)
      } else {
        pending.reject(new Error(data.error))
      }
    }

    base64Worker.onerror = (event) => {
      console.error('Base64 worker error:', event.message)
      base64Worker?.terminate()
      base64Worker = null

      workerPromises.forEach(({ reject }) => {
        reject(new Error(event.message))
      })
      workerPromises.clear()
    }
  }

  return base64Worker
}

async function encodeWithWorker(
  request: Omit<Base64WorkerRequest, 'id'>
): Promise<string> {
  const worker = getWorker()
  if (!worker) {
    throw new Error('Worker not available')
  }

  const requestId = ++workerRequestId
  const payload: Base64WorkerRequest = {
    ...request,
    id: requestId,
  } as Base64WorkerRequest

  return new Promise<string>((resolve, reject) => {
    workerPromises.set(requestId, { resolve, reject })
    try {
      worker.postMessage(payload)
    } catch (error) {
      workerPromises.delete(requestId)
      reject(error)
    }
  })
}

export async function encodeFileBase64(file: File): Promise<string> {
  try {
    return await encodeWithWorker({ type: 'file', file } as Omit<
      Base64WorkerRequest,
      'id'
    >)
  } catch (error) {
    console.error('Worker encoding failed, falling back:', error)
    const buffer = await file.arrayBuffer()
    return arrayBufferToBase64(buffer)
  }
}

export async function encodeBytesBase64(bytes: Uint8Array): Promise<string> {
  const buffer = (() => {
    if (
      bytes.byteOffset === 0 &&
      bytes.byteLength === bytes.buffer.byteLength &&
      bytes.buffer instanceof ArrayBuffer
    ) {
      return bytes.buffer
    }

    const copied = new Uint8Array(bytes.byteLength)
    copied.set(bytes)
    return copied.buffer
  })()

  try {
    return await encodeWithWorker({ type: 'bytes', buffer } as Omit<
      Base64WorkerRequest,
      'id'
    >)
  } catch (error) {
    console.error('Worker encoding failed, falling back:', error)
    return arrayBufferToBase64(buffer)
  }
}
