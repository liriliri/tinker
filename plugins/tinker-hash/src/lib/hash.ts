import * as CryptoJS from 'crypto-js'

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512'

type FileHashRequest = {
  type: 'file-hash'
  id: number
  file: File
}

type FileHashResult = {
  type: 'result'
  id: number
  results: Record<HashAlgorithm, string>
}

type FileHashError = {
  type: 'error'
  id: number
  error: string
}

type WorkerResponse = FileHashResult | FileHashError

let hashWorker: Worker | null = null
let workerRequestId = 0
const workerPromises: Map<
  number,
  {
    resolve: (value: Record<HashAlgorithm, string>) => void
    reject: (reason?: unknown) => void
  }
> = new Map()

export const HASH_ALGORITHMS: HashAlgorithm[] = [
  'md5',
  'sha1',
  'sha256',
  'sha512',
]

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null

  if (!hashWorker) {
    hashWorker = new Worker(new URL('./hash.worker.ts', import.meta.url), {
      type: 'module',
    })

    hashWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data
      const pending = workerPromises.get(data.id)

      if (!pending) return
      workerPromises.delete(data.id)

      if (data.type === 'result') {
        pending.resolve(data.results)
      } else {
        pending.reject(new Error(data.error))
      }
    }

    hashWorker.onerror = (event) => {
      console.error('Hash worker error:', event.message)
      hashWorker?.terminate()
      hashWorker = null

      workerPromises.forEach(({ reject }) => {
        reject(new Error(event.message))
      })
      workerPromises.clear()
    }
  }

  return hashWorker
}

async function calculateFileHashesInMainThread(
  file: File
): Promise<Record<HashAlgorithm, string>> {
  const arrayBuffer = await file.arrayBuffer()
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)

  return {
    md5: CryptoJS.MD5(wordArray).toString(),
    sha1: CryptoJS.SHA1(wordArray).toString(),
    sha256: CryptoJS.SHA256(wordArray).toString(),
    sha512: CryptoJS.SHA512(wordArray).toString(),
  }
}

async function calculateFileHashesWithWorker(
  file: File
): Promise<Record<HashAlgorithm, string>> {
  const worker = getWorker()
  if (!worker) {
    return calculateFileHashesInMainThread(file)
  }

  const requestId = ++workerRequestId
  const request: FileHashRequest = {
    type: 'file-hash',
    id: requestId,
    file,
  }

  return new Promise((resolve, reject) => {
    workerPromises.set(requestId, { resolve, reject })
    try {
      worker.postMessage(request)
    } catch (error) {
      workerPromises.delete(requestId)
      reject(error)
    }
  })
}

export function calculateHash(algorithm: HashAlgorithm, input: string): string {
  if (!input) return ''

  try {
    const hashFunctions = {
      md5: CryptoJS.MD5,
      sha1: CryptoJS.SHA1,
      sha256: CryptoJS.SHA256,
      sha512: CryptoJS.SHA512,
    }

    const hashFn = hashFunctions[algorithm]
    const result = hashFn(input)
    return result.toString()
  } catch (error) {
    console.error(`Failed to calculate ${algorithm} hash:`, error)
    return ''
  }
}

export function calculateAllHashes(
  input: string
): Record<HashAlgorithm, string> {
  return {
    md5: calculateHash('md5', input),
    sha1: calculateHash('sha1', input),
    sha256: calculateHash('sha256', input),
    sha512: calculateHash('sha512', input),
  }
}

export async function calculateFileHashes(
  file: File
): Promise<Record<HashAlgorithm, string>> {
  try {
    return await calculateFileHashesWithWorker(file)
  } catch (error) {
    console.error('Worker hashing failed, falling back to main thread:', error)
    return calculateFileHashesInMainThread(file)
  }
}
