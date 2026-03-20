import type { ApiType, AiModel } from '../types'

export const API_TYPE_DEFAULTS: Record<
  ApiType,
  { apiUrl: string; models: AiModel[] }
> = {
  openai: {
    apiUrl: 'https://api.openai.com/v1',
    models: [
      { name: 'gpt-4o' },
      { name: 'gpt-4o-mini' },
      { name: 'gpt-4.1' },
      { name: 'o3' },
      { name: 'o4-mini' },
    ],
  },
  claude: {
    apiUrl: 'https://api.anthropic.com',
    models: [
      { name: 'claude-opus-4-5' },
      { name: 'claude-sonnet-4-5' },
      { name: 'claude-haiku-4-5' },
    ],
  },
}
