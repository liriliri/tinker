import base64 from 'licia/base64'

type Base64Request =
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

type Base64Response =
  | {
      type: 'result'
      id: number
      base64: string
    }
  | {
      type: 'error'
      id: number
      error: string
    }

addEventListener('message', async (event: MessageEvent<Base64Request>) => {
  const data = event.data

  try {
    let bytes: Uint8Array
    if (data.type === 'file') {
      const buffer = await data.file.arrayBuffer()
      bytes = new Uint8Array(buffer)
    } else {
      bytes = new Uint8Array(data.buffer)
    }

    const byteArray = Array.from(bytes)
    const encoded = base64.encode(byteArray)
    const response: Base64Response = {
      type: 'result',
      id: data.id,
      base64: encoded,
    }
    postMessage(response)
  } catch (error) {
    const response: Base64Response = {
      type: 'error',
      id: data.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    postMessage(response)
  }
})

export {}
