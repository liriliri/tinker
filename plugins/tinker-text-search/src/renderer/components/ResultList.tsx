import { observer } from 'mobx-react-lite'
import store from '../store'
import FileGroup from './FileGroup'

export default observer(function ResultList() {
  return (
    <div className="flex-1 overflow-y-auto">
      {store.groups.map((g) => (
        <FileGroup key={g.path} group={g} />
      ))}
    </div>
  )
})
