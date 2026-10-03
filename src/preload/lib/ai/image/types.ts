export type AiImageApiType = 'openai' | 'gemini' | 'volcengine' | 'openrouter'

export interface AiImageModel {
  name: string
}

export interface AiImageProvider {
  name: string
  apiUrl: string
  apiKey: string
  models: AiImageModel[]
  apiType?: AiImageApiType
}

export interface AiImageProviderInfo {
  name: string
  models: AiImageModel[]
}

export type AiImageInput =
  | string
  | { path: string }
  | { data: string; mimeType?: string }

export interface GenerateImageOption {
  provider?: string
  model?: string
  prompt: string
  size?: string
  count?: number
  outputPath?: string
}

export interface EditImageOption extends GenerateImageOption {
  image: AiImageInput
  referenceImages?: AiImageInput[]
}

export interface GeneratedImage {
  path: string
  mimeType: string
  bytes: number
}

export interface GenerateImageResult {
  images: GeneratedImage[]
  provider: string
  model: string
}

export interface GenerateImageTask extends Promise<GenerateImageResult> {
  abort(): void
}
