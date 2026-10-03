type ApiType = 'openai' | 'claude'
type ImageApiType = 'openai' | 'gemini' | 'volcengine' | 'openrouter'
type AiMode = 'chat' | 'image'

type Section = 'general' | 'ai' | 'plugin'

interface AiModel {
  name: string
  capabilities?: string[]
  contextWindow?: number
  maxOutput?: number
}

interface AiProvider {
  name: string
  apiUrl: string
  apiKey: string
  models: AiModel[]
  apiType: ApiType
}

interface AiImageModel {
  name: string
}

interface AiImageProvider {
  name: string
  apiUrl: string
  apiKey: string
  models: AiImageModel[]
  apiType: ImageApiType
}

export type {
  ApiType,
  ImageApiType,
  AiMode,
  Section,
  AiModel,
  AiProvider,
  AiImageProvider,
}
