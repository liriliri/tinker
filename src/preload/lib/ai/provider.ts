import mainObj from 'share/preload/main'
import type { AiModel, AiProvider } from './types'

export interface AiProviderInfo {
  name: string
  models: AiModel[]
}

export async function getProviders(): Promise<AiProvider[]> {
  const raw = await mainObj.getSettingsStore('aiProviders')
  if (!raw) return []
  try {
    return JSON.parse(raw as string)
  } catch {
    return []
  }
}

export async function getProviderList(): Promise<AiProviderInfo[]> {
  const providers = await getProviders()
  return providers.map((p) => ({ name: p.name, models: p.models ?? [] }))
}

export async function findProvider(
  providerName?: string
): Promise<AiProvider | null> {
  const providers = await getProviders()
  if (!providers.length) return null
  if (providerName) {
    return providers.find((p) => p.name === providerName) ?? providers[0]
  }
  return providers[0]
}
