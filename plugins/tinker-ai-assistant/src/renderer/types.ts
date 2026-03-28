import type { Agent, AgentMessage } from 'share/lib/Agent'

export type { AgentMessage as ChatMessage }

export interface SessionData {
  messages: AgentMessage[]
  workingDir: string
}

export interface Session extends Omit<SessionData, 'messages'> {
  agent: Agent
}
