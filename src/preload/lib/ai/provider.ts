import mainObj from 'share/preload/main'
import type { AiProvider } from './types'

export async function getProviders(): Promise<AiProvider[]> {
  const raw = await mainObj.getSettingsStore('aiProviders')
  if (!raw) return []
  try {
    return JSON.parse(raw as string)
  } catch {
    return []
  }
}

export async function findProvider(
  providerId?: string
): Promise<AiProvider | null> {
  const providers = await getProviders()
  if (!providers.length) return null
  if (providerId) {
    return providers.find((p) => p.id === providerId) ?? providers[0]
  }
  return providers[0]
}
