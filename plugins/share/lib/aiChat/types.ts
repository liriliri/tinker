import type { Agent, AgentMessage } from '../Agent'

export type ChatMessage = AgentMessage

export interface SessionData {
  id: string
  messages: AgentMessage[]
  createdAt: number
}

export interface Session extends Omit<SessionData, 'messages'> {
  agent: Agent
}
