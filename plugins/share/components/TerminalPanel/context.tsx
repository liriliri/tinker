import { createContext, useContext } from 'react'
import type TerminalStore from '../../store/Terminal'

export interface TerminalPanelContextValue {
  terminal: TerminalStore
  isDark: boolean
}

export const TerminalPanelContext =
  createContext<TerminalPanelContextValue | null>(null)

export function useTerminalPanel() {
  const ctx = useContext(TerminalPanelContext)
  if (!ctx) {
    throw new Error('useTerminalPanel must be used within TerminalPanel')
  }
  return ctx
}
