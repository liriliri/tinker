import type { AiImageProvider } from './types'
import {
  collectGeneratedOutputs,
  normalizeImageBaseUrl,
  outputMimeType,
  readProviderError,
  toImageDataUrl,
  type ImageCallParams,
  type RawGeneratedImage,
  type ResolvedImageInput,
} from './util'

export async function callVolcengineImages(
  provider: AiImageProvider,
  model: string,
  prompt: string,
  params: ImageCallParams,
  inputs: ResolvedImageInput[] | null,
  signal?: AbortSignal
): Promise<RawGeneratedImage[]> {
  const baseUrl = normalizeImageBaseUrl(provider.apiUrl)
  const mimeType = outputMimeType(params.outputFormat)
  const body: Record<string, unknown> = {
    model,
    prompt,
    size: params.size,
    response_format: 'b64_json',
    watermark: false,
  }
  if (params.outputFormat === 'png' || params.outputFormat === 'jpeg') {
    body.output_format = params.outputFormat
  }
  if (inputs?.length) {
    body.image =
      inputs.length === 1
        ? toImageDataUrl(inputs[0])
        : inputs.map((image) => toImageDataUrl(image))
  }

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readProviderError(response))
  }

  const payload = (await response.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string; url?: string }>
  }
  return collectGeneratedOutputs(payload, mimeType, signal)
}
