import { createContext, useContext } from 'react'
import type Terminal from '../../store/Terminal'

export interface TerminalPanelContextValue {
  terminal: Terminal
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
