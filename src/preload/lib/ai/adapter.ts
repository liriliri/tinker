import type { AiCallOption, AiChunk, AiMessage, AiProvider } from './types'

/**
 * Each API format implements this interface.
 * Add a new format by creating a class that extends AiAdapter
 * and registering it in index.ts.
 */
export abstract class AiAdapter {
  constructor(protected provider: AiProvider) {}

  /** Non-streaming call — returns the finished assistant message. */
  abstract call(option: AiCallOption): Promise<AiMessage>

  /** Streaming call — fires onChunk for each delta, final chunk has done=true. */
  abstract stream(
    option: AiCallOption,
    onChunk: (chunk: AiChunk) => void,
    signal: AbortSignal
  ): Promise<void>
}
