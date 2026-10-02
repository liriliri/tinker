import contain from 'licia/contain'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import some from 'licia/some'
import trim from 'licia/trim'
import type { ApiType, AiModel } from '../types'

export interface ProviderPreset {
  id: string
  name: string
  apiType: ApiType
  apiUrl: string
}

export const CUSTOM_PRESET_ID = 'custom'

export const API_TYPE_DEFAULT_URL: Record<ApiType, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
}

export const POPULAR_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiType: 'openai',
    apiUrl: API_TYPE_DEFAULT_URL.openai,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    apiType: 'claude',
    apiUrl: API_TYPE_DEFAULT_URL.claude,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiType: 'openai',
    apiUrl: 'https://api.deepseek.com',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiType: 'openai',
    apiUrl: 'https://openrouter.ai/api/v1',
  },
]

const SKIP_MODEL_KEYWORDS = [
  'embed',
  'whisper',
  'tts',
  'dall-e',
  'moderation',
  'transcribe',
]

function shouldSkipModel(id: string): boolean {
  const lower = lowerCase(id)
  return some(SKIP_MODEL_KEYWORDS, (kw) => contain(lower, kw))
}

export async function fetchOpenAiModels(
  apiUrl: string,
  apiKey: string
): Promise<AiModel[]> {
  const url = `${trim(apiUrl).replace(/\/+$/, '')}/models`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const json = (await res.json()) as { data?: unknown }
  if (!isArr(json.data)) {
    throw new Error('invalid response')
  }
  return map(
    filter(json.data, (item) => {
      if (!item || typeof item !== 'object') return false
      const id = (item as { id?: unknown }).id
      return isStr(id) && !isStrBlank(id) && !shouldSkipModel(id)
    }),
    (item) => ({ name: (item as { id: string }).id })
  )
}
