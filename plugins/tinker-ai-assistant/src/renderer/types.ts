import type { AgentMessage } from 'share/lib/Agent'

export type { AgentMessage as ChatMessage }

export interface Session {
  messages: AgentMessage[]
  workingDir: string
}
