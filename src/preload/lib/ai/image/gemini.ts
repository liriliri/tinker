import type { AiImageProvider } from './types'
import {
  aspectRatioForSize,
  normalizeImageBaseUrl,
  OUTPUT_MIME,
  readProviderError,
  type ImageCallParams,
  type RawGeneratedImage,
  type ResolvedImageInput,
} from './util'

type GeminiImageBlock = {
  data?: string
  mime_type?: string
  mimeType?: string
  type?: string
}

function collectGeminiImages(payload: {
  output_image?: GeminiImageBlock
  output_images?: GeminiImageBlock[]
  steps?: Array<{ content?: GeminiImageBlock[] }>
}): GeminiImageBlock[] {
  const blocks: GeminiImageBlock[] = []
  if (payload.output_image) blocks.push(payload.output_image)
  if (Array.isArray(payload.output_images)) {
    blocks.push(...payload.output_images)
  }
  if (Array.isArray(payload.steps)) {
    for (const step of payload.steps) {
      if (!Array.isArray(step.content)) continue
      for (const item of step.content) {
        if (item?.type === 'image' || item?.data) blocks.push(item)
      }
    }
  }
  return blocks
}

export async function callGeminiImages(
  provider: AiImageProvider,
  model: string,
  prompt: string,
  params: ImageCallParams,
  inputs: ResolvedImageInput[] | null,
  signal?: AbortSignal
): Promise<RawGeneratedImage[]> {
  const baseUrl = normalizeImageBaseUrl(provider.apiUrl)
  const input =
    inputs && inputs.length
      ? [
          { type: 'text' as const, text: prompt },
          ...inputs.map((image) => ({
            type: 'image' as const,
            mime_type: image.mimeType,
            data: image.base64,
          })),
        ]
      : prompt

  const response = await fetch(`${baseUrl}/interactions`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': provider.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input,
      response_format: {
        type: 'image',
        mime_type: OUTPUT_MIME,
        aspect_ratio: aspectRatioForSize(params.size),
      },
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readProviderError(response))
  }

  const payload = (await response.json().catch(() => ({}))) as {
    output_image?: GeminiImageBlock
    output_images?: GeminiImageBlock[]
    steps?: Array<{ content?: GeminiImageBlock[] }>
  }

  const outputs: RawGeneratedImage[] = []
  for (const item of collectGeminiImages(payload)) {
    if (!item?.data) continue
    outputs.push({
      bytes: Buffer.from(item.data, 'base64'),
      mimeType: item.mime_type || item.mimeType || OUTPUT_MIME,
    })
  }

  if (!outputs.length) {
    throw new Error(
      'Gemini returned no image; confirm the model supports image output'
    )
  }
  return outputs
}
