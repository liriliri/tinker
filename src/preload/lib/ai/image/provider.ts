import mainObj from 'share/preload/main'
import type {
  AiImageApiType,
  AiImageProvider,
  AiImageProviderInfo,
} from './types'

export function normalizeImageApiType(value: unknown): AiImageApiType {
  if (
    value === 'gemini' ||
    value === 'volcengine' ||
    value === 'openrouter' ||
    value === 'openai'
  ) {
    return value
  }
  return 'openai'
}

export async function getImageProviders(): Promise<AiImageProvider[]> {
  const raw = await mainObj.getSettingsStore('aiImageProviders')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw as string)
    if (!Array.isArray(parsed)) return []
    return parsed.map((p) => ({
      ...p,
      apiType: normalizeImageApiType(p?.apiType),
      models: Array.isArray(p?.models) ? p.models : [],
    }))
  } catch {
    return []
  }
}

export async function getImageProviderList(): Promise<AiImageProviderInfo[]> {
  const providers = await getImageProviders()
  return providers.map((p) => ({
    name: p.name,
    models: p.models ?? [],
  }))
}

export async function findImageProvider(
  providerName?: string
): Promise<AiImageProvider | null> {
  const providers = await getImageProviders()
  if (!providers.length) return null
  if (providerName) {
    return providers.find((p) => p.name === providerName) ?? providers[0]
  }
  return providers[0]
}
