import * as CryptoJS from 'crypto-js'
import type { HashAlgorithm } from './hash'

interface FileHashRequest {
  type: 'file-hash'
  id: number
  file: File
}

interface FileHashResult {
  type: 'result'
  id: number
  results: Record<HashAlgorithm, string>
}

interface FileHashError {
  type: 'error'
  id: number
  error: string
}

type WorkerMessage = FileHashRequest
type WorkerResponse = FileHashResult | FileHashError

async function calculateFileHashes(
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

async function handleFileHashRequest(
  data: FileHashRequest
): Promise<WorkerResponse> {
  try {
    const results = await calculateFileHashes(data.file)
    return { type: 'result', id: data.id, results }
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Unknown error while hashing file'
    return { type: 'error', id: data.id, error }
  }
}

addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const data = event.data
  if (data.type !== 'file-hash') return

  const response = await handleFileHashRequest(data)
  postMessage(response)
})

export {}
