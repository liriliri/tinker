import { tw } from '../../theme'
import FileGroup from './FileGroup'
import { useTextSearchContext } from './context'

export default function ResultList() {
  const { groups, collapsed } = useTextSearchContext()
  return (
    <div className={`flex-1 overflow-y-auto ${tw.bg.tertiary}`}>
      {groups.map((g) => (
        <FileGroup
          key={g.path}
          group={g}
          collapsed={collapsed[g.path] === true}
        />
      ))}
    </div>
  )
}
