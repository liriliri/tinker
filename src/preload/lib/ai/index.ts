import uuid from 'licia/uuid'
import type { AiAdapter } from './adapter'
import { ClaudeAdapter } from './claude'
import { OpenAIAdapter } from './openai'
import { findProvider } from './provider'
import type { AiCallOption, AiChunk, AiProvider, AiResult } from './types'

export type {
  AiApiType,
  AiCallOption,
  AiChunk,
  AiContentPart,
  AiMessage,
  AiProvider,
  AiResult,
  AiTool,
  AiToolCall,
} from './types'

// ─── Adapter registry ─────────────────────────────────────────────────────────
// To add a new format: implement AiAdapter and register it here.

const adapterRegistry: Record<string, new (provider: AiProvider) => AiAdapter> =
  {
    openai: OpenAIAdapter,
    claude: ClaudeAdapter,
  }

function createAdapter(
  provider: Awaited<ReturnType<typeof findProvider>>
): AiAdapter {
  if (!provider) throw new Error('No AI provider configured')
  const AdapterClass =
    adapterRegistry[provider.apiType ?? 'openai'] ?? OpenAIAdapter
  return new AdapterClass(provider)
}

// ─── Abort controllers ────────────────────────────────────────────────────────

const abortControllers = new Map<string, AbortController>()

// ─── Public API ───────────────────────────────────────────────────────────────

export async function callAI(option: AiCallOption): Promise<AiResult> {
  const provider = await findProvider(option.provider)
  if (!provider) return { success: false, error: 'No AI provider configured' }

  try {
    const adapter = createAdapter(provider)
    const data = await adapter.call(option)
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) }
  }
}

export function callAIStream(
  option: AiCallOption,
  onChunk: (chunk: AiChunk) => void
): { promise: Promise<void>; requestId: string } {
  const requestId = uuid()

  const promise = (async () => {
    const provider = await findProvider(option.provider)
    if (!provider) {
      onChunk({ error: 'No AI provider configured', done: true })
      throw new Error('No AI provider configured')
    }

    const controller = new AbortController()
    abortControllers.set(requestId, controller)

    try {
      const adapter = createAdapter(provider)
      await adapter.stream(option, onChunk, controller.signal)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onChunk({ error: 'Request aborted', done: true })
        throw new Error('Request aborted')
      }
      onChunk({ error: err.message || String(err), done: true })
      throw err
    } finally {
      abortControllers.delete(requestId)
    }
  })()

  return { promise, requestId }
}

export function abortAI(requestId: string): void {
  const controller = abortControllers.get(requestId)
  if (controller) {
    controller.abort()
    abortControllers.delete(requestId)
  }
}
