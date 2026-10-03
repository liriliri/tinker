import isStrBlank from 'licia/isStrBlank'
import uuid from 'licia/uuid'
import { callGeminiImages } from './gemini'
import { callOpenAiImages } from './openai'
import { callOpenRouterImages } from './openrouter'
import { callVolcengineImages } from './volcengine'
import {
  findImageProvider,
  getImageProviderList,
  normalizeImageApiType,
} from './provider'
import type {
  AiImageProvider,
  EditImageOption,
  GenerateImageOption,
  GenerateImageResult,
} from './types'
import {
  resolveImageInputs,
  resolveImageModel,
  resolveImageParams,
  saveGeneratedImages,
  type RawGeneratedImage,
  type ResolvedImageInput,
} from './util'

export type {
  AiImageApiType,
  AiImageInput,
  AiImageModel,
  AiImageProvider,
  AiImageProviderInfo,
  EditImageOption,
  GenerateImageOption,
  GenerateImageResult,
  GenerateImageTask,
  GeneratedImage,
} from './types'
export { getImageProviderList }

const abortControllers = new Map<string, AbortController>()

const IMAGE_CALLERS = {
  gemini: callGeminiImages,
  volcengine: callVolcengineImages,
  openrouter: callOpenRouterImages,
  openai: callOpenAiImages,
} as const

async function callImageProvider(
  provider: AiImageProvider,
  model: string,
  prompt: string,
  params: ReturnType<typeof resolveImageParams>,
  inputs: ResolvedImageInput[] | null,
  signal?: AbortSignal
): Promise<RawGeneratedImage[]> {
  const apiType = normalizeImageApiType(provider.apiType)
  const caller = IMAGE_CALLERS[apiType]
  // Gemini / OpenRouter / Volcengine only return one image per request.
  const singleImage =
    apiType === 'gemini' || apiType === 'openrouter' || apiType === 'volcengine'

  if (!singleImage || params.count <= 1) {
    return caller(provider, model, prompt, params, inputs, signal)
  }

  const outputs: RawGeneratedImage[] = []
  for (let i = 0; i < params.count; i++) {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError')
    }
    const batch = await caller(
      provider,
      model,
      prompt,
      { ...params, count: 1 },
      inputs,
      signal
    )
    outputs.push(...batch)
  }
  return outputs
}

async function runGenerate(
  option: GenerateImageOption,
  inputs: ResolvedImageInput[] | null,
  signal?: AbortSignal
): Promise<GenerateImageResult> {
  if (isStrBlank(option.prompt)) {
    throw new Error('Prompt is required')
  }

  const provider = await findImageProvider(option.provider)
  if (!provider) throw new Error('No image provider configured')

  const apiType = normalizeImageApiType(provider.apiType)
  const model = resolveImageModel(provider, option.model)
  const params = resolveImageParams(option, apiType)
  const outputs = await callImageProvider(
    provider,
    model,
    option.prompt,
    params,
    inputs,
    signal
  )
  const images = await saveGeneratedImages(outputs, option.outputPath)
  return {
    images,
    provider: provider.name,
    model,
  }
}

function createImageTask(
  run: (signal: AbortSignal) => Promise<GenerateImageResult>
): { promise: Promise<GenerateImageResult>; requestId: string } {
  const requestId = uuid()
  const controller = new AbortController()
  abortControllers.set(requestId, controller)

  const promise = (async () => {
    try {
      return await run(controller.signal)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Request aborted')
      }
      throw err
    } finally {
      abortControllers.delete(requestId)
    }
  })()

  return { promise, requestId }
}

export function generateImage(option: GenerateImageOption): {
  promise: Promise<GenerateImageResult>
  requestId: string
} {
  return createImageTask((signal) => runGenerate(option, null, signal))
}

export function editImage(option: EditImageOption): {
  promise: Promise<GenerateImageResult>
  requestId: string
} {
  return createImageTask(async (signal) => {
    const inputs = await resolveImageInputs(
      option.image,
      option.referenceImages
    )
    return runGenerate(option, inputs, signal)
  })
}

export function abortImage(requestId: string): void {
  const controller = abortControllers.get(requestId)
  if (controller) {
    controller.abort()
    abortControllers.delete(requestId)
  }
}
