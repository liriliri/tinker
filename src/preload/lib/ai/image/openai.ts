import type { AiImageProvider } from './types'
import {
  collectGeneratedOutputs,
  normalizeImageBaseUrl,
  outputMimeType,
  readProviderError,
  type ImageCallParams,
  type RawGeneratedImage,
  type ResolvedImageInput,
} from './util'

export async function callOpenAiImages(
  provider: AiImageProvider,
  model: string,
  prompt: string,
  params: ImageCallParams,
  inputs: ResolvedImageInput[] | null,
  signal?: AbortSignal
): Promise<RawGeneratedImage[]> {
  const baseUrl = normalizeImageBaseUrl(provider.apiUrl)
  const mimeType = outputMimeType(params.outputFormat)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
  }

  let response: Response

  if (inputs?.length) {
    const form = new FormData()
    form.append('model', model)
    form.append('prompt', prompt)
    form.append('n', String(params.count))
    form.append('size', params.size)
    form.append('output_format', params.outputFormat)
    form.append('background', params.transparent ? 'transparent' : 'opaque')
    for (const [index, image] of inputs.entries()) {
      const blob = new Blob([new Uint8Array(image.buffer)], {
        type: image.mimeType,
      })
      form.append(
        inputs.length > 1 ? 'image[]' : 'image',
        blob,
        image.filename || `input-${index + 1}.png`
      )
    }
    response = await fetch(`${baseUrl}/images/edits`, {
      method: 'POST',
      headers,
      body: form,
      signal,
    })
  } else {
    headers['Content-Type'] = 'application/json'
    const body: Record<string, unknown> = {
      model,
      prompt,
      n: params.count,
      size: params.size,
      response_format: 'b64_json',
      output_format: params.outputFormat,
      background: params.transparent ? 'transparent' : 'opaque',
    }
    if (params.quality) body.quality = params.quality
    response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })
  }

  if (!response.ok) {
    throw new Error(await readProviderError(response))
  }

  const payload = (await response.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string; url?: string }>
  }
  return collectGeneratedOutputs(payload, mimeType, signal)
}
