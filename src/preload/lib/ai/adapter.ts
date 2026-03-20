import type { AiCallOption, AiChunk, AiMessage, AiProvider } from './types'

export abstract class AiAdapter {
  constructor(protected provider: AiProvider) {}

  abstract call(option: AiCallOption): Promise<AiMessage>

  abstract stream(
    option: AiCallOption,
    onChunk: (chunk: AiChunk) => void,
    signal: AbortSignal
  ): Promise<void>
}
