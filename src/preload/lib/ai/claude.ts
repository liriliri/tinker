import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModelV3 } from '@ai-sdk/provider'
import { AiAdapter } from './adapter'
import type { AiCallOption, AiProvider } from './types'

export class ClaudeAdapter extends AiAdapter {
  constructor(provider: AiProvider) {
    super(provider)
  }

  protected getModel(option: AiCallOption): LanguageModelV3 {
    return createAnthropic({
      baseURL: this.provider.apiUrl,
      apiKey: this.provider.apiKey,
    }).chat(option.model ?? this.provider.models[0]?.name ?? '')
  }
}
