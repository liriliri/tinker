import contain from 'licia/contain'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import isStrBlank from 'licia/isStrBlank'
import keys from 'licia/keys'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import rtrim from 'licia/rtrim'
import some from 'licia/some'
import trim from 'licia/trim'
import type { ApiType, AiModel, ImageApiType } from '../types'

interface ProviderPreset {
  id: string
  name: string
  apiType: ApiType
  apiUrl: string
}

interface ImageProviderPreset {
  apiType: ImageApiType
  apiUrl: string
}

export const CUSTOM_PRESET_ID = 'custom'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

export const API_TYPE_DEFAULT_URL: Record<ApiType, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
}

export const IMAGE_API_TYPE_DEFAULT_URL: Record<ImageApiType, string> = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  volcengine: 'https://ark.cn-beijing.volces.com/api/v3',
  openrouter: OPENROUTER_API_URL,
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
    apiUrl: OPENROUTER_API_URL,
  },
]

export const IMAGE_PRESETS: ImageProviderPreset[] = map(
  keys(IMAGE_API_TYPE_DEFAULT_URL) as ImageApiType[],
  (apiType) => ({
    apiType,
    apiUrl: IMAGE_API_TYPE_DEFAULT_URL[apiType],
  })
)

export type ProviderBrand =
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'volcengine'
  | 'openrouter'

const API_TYPE_BRAND: Record<string, ProviderBrand> = {
  openai: 'openai',
  claude: 'claude',
  gemini: 'gemini',
  volcengine: 'volcengine',
  openrouter: 'openrouter',
}

export function resolveProviderBrand(
  apiUrl: string,
  apiType: string
): ProviderBrand {
  const url = lowerCase(trim(apiUrl))
  if (contain(url, 'openrouter.ai')) return 'openrouter'
  if (contain(url, 'anthropic.com')) return 'claude'
  if (contain(url, 'generativelanguage.googleapis.com')) return 'gemini'
  if (contain(url, 'volces.com') || contain(url, 'volcengine.com')) {
    return 'volcengine'
  }
  if (contain(url, 'openai.com')) return 'openai'
  return API_TYPE_BRAND[apiType] || 'openai'
}

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
  const url = `${rtrim(trim(apiUrl), '/')}/models`
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
      if (!isObj(item) || isArr(item)) return false
      const id = (item as { id?: unknown }).id
      return isStr(id) && !isStrBlank(id) && !shouldSkipModel(id)
    }),
    (item) => ({ name: (item as { id: string }).id })
  )
}
