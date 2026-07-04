import isStrBlank from 'licia/isStrBlank'
import { Agent, type AgentTool } from '../Agent'
import type { ChatDbApi } from './chatDb'
import type { Session, SessionData } from './types'

export interface ChatSessionApi {
  createEmptySession: () => Session
  createSessionFromData: (session: SessionData) => Session
  serializeSession: (session: Session) => SessionData
  hasSessionContent: (session: SessionData) => boolean
}

export interface CreateChatSessionOptions {
  chatDb: ChatDbApi
  systemPrompt: string
  tools: AgentTool[]
}

export function createChatSession(
  options: CreateChatSessionOptions
): ChatSessionApi {
  const { chatDb, systemPrompt, tools } = options

  function createAgent(initialMessages: SessionData['messages'] = []) {
    return new Agent({
      systemPrompt,
      tools,
      initialMessages,
    })
  }

  function createSessionFromData(session: SessionData): Session {
    return {
      id: session.id,
      createdAt: session.createdAt,
      agent: createAgent(session.messages),
    }
  }

  function serializeSession(session: Session): SessionData {
    return {
      id: session.id,
      messages: session.agent.getMessages(),
      createdAt: session.createdAt,
    }
  }

  function hasSessionContent(session: SessionData): boolean {
    return session.messages.some(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        !isStrBlank(message.content)
    )
  }

  function createEmptySession(): Session {
    return {
      id: chatDb.SESSION_ID,
      createdAt: Date.now(),
      agent: createAgent(),
    }
  }

  return {
    createEmptySession,
    createSessionFromData,
    serializeSession,
    hasSessionContent,
  }
}
