import { observer } from 'mobx-react-lite'
import { tw } from '../../theme'
import { addI18nNamespace } from '../../lib/i18n'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import { TEXT_SEARCH_NS } from './namespace'
import { TextSearchContext, type TextSearchContextValue } from './context'
import SearchHeader from './SearchHeader'
import ResultList from './ResultList'
import EmptyState from './EmptyState'

addI18nNamespace(TEXT_SEARCH_NS, { 'en-US': enUS, 'zh-CN': zhCN })

export type { TextSearchContextValue } from './context'

interface TextSearchSidebarProps extends TextSearchContextValue {
  className?: string
}

const TextSearchSidebar = observer(function TextSearchSidebar({
  search,
  onSelectMatch,
  showFolderPicker,
  className = '',
}: TextSearchSidebarProps) {
  const renderBody = () => {
    if (!search.rootDir) return <EmptyState variant="no-folder" />
    if (!search.query.trim()) return <EmptyState variant="no-query" />
    if (search.groups.length === 0) {
      if (search.searching) return <div className="flex-1" />
      return <EmptyState variant="no-results" />
    }
    return <ResultList />
  }

  return (
    <TextSearchContext.Provider
      value={{ search, onSelectMatch, showFolderPicker }}
    >
      <div className={`h-full flex flex-col ${tw.bg.primary} ${className}`}>
        <SearchHeader />
        {renderBody()}
      </div>
    </TextSearchContext.Provider>
  )
})

export default TextSearchSidebar
