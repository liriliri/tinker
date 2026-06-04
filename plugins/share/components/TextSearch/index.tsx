import { tw } from '../../theme'
import { TextSearchContext, type TextSearchContextValue } from './context'
import SearchHeader from './SearchHeader'
import ResultList from './ResultList'
import EmptyState from './EmptyState'

export type { TextSearchContextValue } from './context'
export type {
  TextSearchUIState,
  TextSearchUIActions,
} from '../../lib/textSearch'
export { getTextSearchUIProps } from '../../lib/textSearch'

interface TextSearchSidebarProps extends TextSearchContextValue {
  className?: string
}

export default function TextSearchSidebar({
  className = '',
  ...contextValue
}: TextSearchSidebarProps) {
  const renderBody = () => {
    const { rootDir, query, groups, searching } = contextValue
    if (!rootDir) return <EmptyState variant="no-folder" />
    if (!query.trim()) return <EmptyState variant="no-query" />
    if (groups.length === 0) {
      if (searching) return <div className="flex-1" />
      return <EmptyState variant="no-results" />
    }
    return <ResultList />
  }

  return (
    <TextSearchContext.Provider value={contextValue}>
      <div className={`h-full flex flex-col ${tw.bg.primary} ${className}`}>
        <SearchHeader />
        {renderBody()}
      </div>
    </TextSearchContext.Provider>
  )
}
