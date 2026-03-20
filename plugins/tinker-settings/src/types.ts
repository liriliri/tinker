type ApiType = 'openai' | 'claude'

type Section = 'general' | 'ai'

interface AiProvider {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  model: string
  apiType: ApiType
}

export type { ApiType, Section, AiProvider }
