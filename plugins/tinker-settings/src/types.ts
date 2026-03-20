type ApiType = 'openai' | 'claude'

type Section = 'general' | 'ai'

interface AiModel {
  name: string
  capabilities?: string[]
  contextWindow?: number
  maxOutput?: number
}

interface AiProvider {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  models: AiModel[]
  apiType: ApiType
}

export type { ApiType, Section, AiModel, AiProvider }
