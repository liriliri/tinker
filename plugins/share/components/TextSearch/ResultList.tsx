import { observer } from 'mobx-react-lite'
import { tw } from '../../theme'
import FileGroup from './FileGroup'
import { useTextSearchContext } from './context'

export default observer(function ResultList() {
  const { search } = useTextSearchContext()
  return (
    <div className={`flex-1 overflow-y-auto ${tw.bg.tertiary}`}>
      {search.groups.map((g) => (
        <FileGroup key={g.path} group={g} />
      ))}
    </div>
  )
})
