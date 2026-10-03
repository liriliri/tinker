import type { AiImageProvider } from './types'
import {
  aspectRatioForSize,
  collectGeneratedOutputs,
  normalizeImageBaseUrl,
  OUTPUT_FORMAT,
  OUTPUT_MIME,
  readProviderError,
  toImageDataUrl,
  type ImageCallParams,
  type RawGeneratedImage,
  type ResolvedImageInput,
} from './util'

export async function callOpenRouterImages(
  provider: AiImageProvider,
  model: string,
  prompt: string,
  params: ImageCallParams,
  inputs: ResolvedImageInput[] | null,
  signal?: AbortSignal
): Promise<RawGeneratedImage[]> {
  const baseUrl = normalizeImageBaseUrl(provider.apiUrl)
  const body: Record<string, unknown> = {
    model,
    prompt,
    aspect_ratio: aspectRatioForSize(params.size),
    n: params.count,
    output_format: OUTPUT_FORMAT,
  }
  if (inputs?.length) {
    body.input_references = inputs.map((image) => ({
      type: 'image_url',
      image_url: {
        url: toImageDataUrl(image),
      },
    }))
  }

  const response = await fetch(`${baseUrl}/images`, {
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
  return collectGeneratedOutputs(payload, OUTPUT_MIME, signal)
}
