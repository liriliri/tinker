import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelV3 } from '@ai-sdk/provider'
import { AiAdapter } from './adapter'
import type { AiCallOption, AiProvider } from './types'

export class OpenAIAdapter extends AiAdapter {
  constructor(provider: AiProvider) {
    super(provider)
  }

  protected getModel(option: AiCallOption): LanguageModelV3 {
    return createOpenAI({
      baseURL: this.provider.apiUrl,
      apiKey: this.provider.apiKey,
    }).chat(option.model ?? this.provider.models[0]?.name ?? '')
  }
}
