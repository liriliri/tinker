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
  GenerateImageTask,
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
  return IMAGE_CALLERS[apiType](provider, model, prompt, params, inputs, signal)
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
): GenerateImageTask {
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
  })() as GenerateImageTask

  promise.abort = () => {
    const current = abortControllers.get(requestId)
    if (current) {
      current.abort()
      abortControllers.delete(requestId)
    }
  }

  return promise
}

export function generateImage(option: GenerateImageOption): GenerateImageTask {
  return createImageTask((signal) => runGenerate(option, null, signal))
}

export function editImage(option: EditImageOption): GenerateImageTask {
  return createImageTask(async (signal) => {
    const inputs = await resolveImageInputs(
      option.image,
      option.referenceImages
    )
    return runGenerate(option, inputs, signal)
  })
}
