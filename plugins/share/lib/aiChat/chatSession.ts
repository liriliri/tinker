import isStrBlank from 'licia/isStrBlank'
import { Agent, type AgentTool } from '../Agent'
import type { Session, SessionData } from './types'

export interface ChatSessionOptions {
  sessionId: string
  tools: AgentTool[]
  maxIterations?: number
}

export class ChatSession {
  readonly sessionId: string
  private readonly tools: AgentTool[]
  private readonly maxIterations?: number

  constructor(options: ChatSessionOptions) {
    this.sessionId = options.sessionId
    this.tools = options.tools
    this.maxIterations = options.maxIterations
  }

  private createAgent(initialMessages: SessionData['messages'] = []) {
    return new Agent({
      tools: this.tools,
      maxIterations: this.maxIterations,
      initialMessages,
    })
  }

  createSessionFromData(session: SessionData): Session {
    return {
      id: session.id,
      createdAt: session.createdAt,
      agent: this.createAgent(session.messages),
    }
  }

  serializeSession(session: Session): SessionData {
    return {
      id: session.id,
      messages: session.agent.getMessages(),
      createdAt: session.createdAt,
    }
  }

  hasSessionContent(session: SessionData): boolean {
    return session.messages.some(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        !isStrBlank(message.content)
    )
  }

  createEmptySession(): Session {
    return {
      id: this.sessionId,
      createdAt: Date.now(),
      agent: this.createAgent(),
    }
  }
}
