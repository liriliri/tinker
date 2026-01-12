import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { tw } from 'share/theme'
import store, { KdbxGroup } from '../store'
import { useState } from 'react'

interface GroupItemProps {
  group: KdbxGroup
  level: number
}

const GroupItem = observer(function GroupItem({
  group,
  level,
}: GroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const isSelected = store.selectedGroupId === group.uuid
  const hasChildren = group.groups.length > 0

  const handleClick = () => {
    store.selectGroup(group.uuid)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div>
      <div
        onClick={handleClick}
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded ${
          isSelected ? tw.primary.bg + ' text-white' : tw.hover.both
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren && (
          <button onClick={handleToggle} className="p-0.5">
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        <Folder size={16} />
        <span className="text-sm flex-1 truncate">{group.name}</span>
        <span
          className={`text-xs ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
        >
          {group.entries.length}
        </span>
      </div>

      {isExpanded &&
        group.groups.map((subGroup) => (
          <GroupItem key={subGroup.uuid} group={subGroup} level={level + 1} />
        ))}
    </div>
  )
})

export default observer(function GroupTree() {
  const { t } = useTranslation()

  if (!store.rootGroup) {
    return (
      <div
        className={`p-4 text-center text-sm ${tw.text.light.secondary} ${tw.text.dark.secondary}`}
      >
        {t('noEntries')}
      </div>
    )
  }

  return (
    <div
      className={`h-full overflow-y-auto p-2 ${tw.bg.light.secondary} ${tw.bg.dark.secondary}`}
    >
      <GroupItem group={store.rootGroup} level={0} />
    </div>
  )
})
