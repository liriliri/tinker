export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  generating?: boolean
  error?: string
}
