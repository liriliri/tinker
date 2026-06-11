import { useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  groupWorkingTreeFiles,
  type WorkingTreeDisplayGroup,
} from '../lib/workingTree'
import { tw } from 'share/theme'
import CenteredMessage from './CenteredMessage'
import WorkingTreeCommitBox from './WorkingTreeCommitBox'
import WorkingTreeFileRow from './WorkingTreeFileRow'
import WorkingTreeGroupHeader from './WorkingTreeGroupHeader'
import store from '../store'

export default observer(function WorkingTreeSidebar() {
  const { t } = useTranslation()
  const sections = useMemo(
    () => groupWorkingTreeFiles(store.workingTreeFiles),
    [store.workingTreeFiles]
  )
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<WorkingTreeDisplayGroup, boolean>
  >({
    merge: false,
    staged: false,
    changes: false,
  })

  const toggleGroup = (group: WorkingTreeDisplayGroup) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }

  return (
    <div className={`h-full flex flex-col min-h-0 ${tw.bg.tertiary}`}>
      <WorkingTreeCommitBox />

      <div className="flex-1 min-h-0 overflow-y-auto">
        {store.loadingWorkingTree && store.workingTreeFiles.length === 0 ? (
          <CenteredMessage>{t('loading')}</CenteredMessage>
        ) : sections.length === 0 ? (
          <CenteredMessage>{t('noWorkingTreeChanges')}</CenteredMessage>
        ) : (
          sections.map((section) => {
            const collapsed = collapsedGroups[section.group]

            return (
              <section key={section.group} className="pb-1">
                <WorkingTreeGroupHeader
                  group={section.group}
                  fileCount={section.files.length}
                  collapsed={collapsed}
                  onToggle={() => toggleGroup(section.group)}
                />

                {!collapsed &&
                  section.files.map((file) => (
                    <WorkingTreeFileRow key={file.id} file={file} />
                  ))}
              </section>
            )
          })
        )}
      </div>
    </div>
  )
})
