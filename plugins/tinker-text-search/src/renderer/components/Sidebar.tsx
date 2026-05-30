import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import store from '../store'
import SearchHeader from './SearchHeader'
import ResultList from './ResultList'
import EmptyState from './EmptyState'

export default observer(function Sidebar() {
  const renderBody = () => {
    if (!store.rootDir) return <EmptyState variant="no-folder" />
    if (!store.query.trim()) return <EmptyState variant="no-query" />
    if (store.groups.length === 0) {
      if (store.searching) return <div className="flex-1" />
      return <EmptyState variant="no-results" />
    }
    return <ResultList />
  }

  return (
    <div className={`h-full flex flex-col ${tw.bg.primary}`}>
      <SearchHeader />
      {renderBody()}
    </div>
  )
})
