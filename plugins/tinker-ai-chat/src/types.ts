export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  generating?: boolean
  error?: string
}

export interface Session {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}
