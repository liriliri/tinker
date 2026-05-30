import { createContext, useContext } from 'react'
import type TextSearch from '../../lib/TextSearch'
import type { TextSearchActiveMatch } from '../../lib/TextSearch'

export interface TextSearchContextValue {
  search: TextSearch
  /** Called when the user clicks a match line. */
  onSelectMatch?: (match: TextSearchActiveMatch) => void
  /** Show the folder picker button in the toolbar (default: true). */
  showFolderPicker?: boolean
}

export const TextSearchContext = createContext<TextSearchContextValue | null>(
  null
)

export function useTextSearchContext(): TextSearchContextValue {
  const ctx = useContext(TextSearchContext)
  if (!ctx) {
    throw new Error(
      'useTextSearchContext must be used inside <TextSearchSidebar>'
    )
  }
  return ctx
}
