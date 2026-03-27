import type { AgentMessage } from 'share/lib/Agent'

export type { AgentMessage as ChatMessage }

export interface Session {
  id: string
  title: string
  messages: AgentMessage[]
  systemPrompt: string
  createdAt: number
}
