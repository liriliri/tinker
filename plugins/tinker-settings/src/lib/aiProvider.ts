import type { ApiType } from '../types'

export const API_TYPE_DEFAULTS: Record<
  ApiType,
  { apiUrl: string; model: string }
> = {
  openai: {
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  claude: {
    apiUrl: 'https://api.anthropic.com',
    model: 'claude-opus-4-5',
  },
}
