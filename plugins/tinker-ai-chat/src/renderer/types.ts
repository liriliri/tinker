import type { Agent, AgentMessage } from 'share/lib/Agent'

export type { AgentMessage as ChatMessage }

export interface SessionData {
  id: string
  title: string
  messages: AgentMessage[]
  systemPrompt: string
  createdAt: number
}

export interface Session extends Omit<SessionData, 'messages'> {
  agent: Agent
}
