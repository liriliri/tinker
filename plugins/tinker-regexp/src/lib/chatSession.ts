import isStrBlank from 'licia/isStrBlank'
import { Agent } from 'share/lib/Agent'
import * as chatDb from './chatDb'
import { REGEXP_AGENT_TOOLS } from './chatTools'
import type { Session, SessionData } from '../types/chat'

const DEFAULT_SYSTEM_PROMPT =
  'You are a regular expression assistant. Help the user write, debug, and understand JavaScript regular expressions. You have tools to read and update the editor pattern, flags, and test text. Use tools only when you need current editor values or must apply changes. After reading or updating, reply to the user with a clear explanation. Do not call tools again unless the user asks for another change or check.'

function createAgent(initialMessages: SessionData['messages'] = []) {
  return new Agent({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    tools: REGEXP_AGENT_TOOLS,
    initialMessages,
  })
}

export function createSessionFromData(session: SessionData): Session {
  return {
    id: session.id,
    createdAt: session.createdAt,
    agent: createAgent(session.messages),
  }
}

export function serializeSession(session: Session): SessionData {
  return {
    id: session.id,
    messages: session.agent.getMessages(),
    createdAt: session.createdAt,
  }
}

export function hasSessionContent(session: SessionData): boolean {
  return session.messages.some(
    (message) =>
      (message.role === 'user' || message.role === 'assistant') &&
      !isStrBlank(message.content)
  )
}

export function createEmptySession(): Session {
  return {
    id: chatDb.SESSION_ID,
    createdAt: Date.now(),
    agent: createAgent(),
  }
}
