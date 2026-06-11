import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from '../../theme'
import {
  groupWorkingTreeFiles,
  type WorkingTreeDisplayGroup,
} from '../../lib/workingTree'
import { WorkingTreeContext, type WorkingTreeContextValue } from './context'
import CenteredMessage from './CenteredMessage'
import CommitBox from './CommitBox'
import FileRow from './FileRow'
import GroupHeader from './GroupHeader'
import './i18n'
import { WORKING_TREE_NS } from './i18n'

export type { WorkingTreeContextValue, WorkingTreeRevealIcon } from './context'
export type {
  WorkingTreeUIState,
  WorkingTreeUIActions,
  WorkingTreeController,
} from '../../lib/workingTree'
export { getWorkingTreeUIProps } from '../../lib/workingTree'
export { default as WorkingTreeDiffViewer } from './DiffViewer'
export type { WorkingTreeDiffViewerProps } from './DiffViewer'

interface WorkingTreeSidebarProps extends WorkingTreeContextValue {
  className?: string
}

export default function WorkingTreeSidebar({
  className = '',
  ...contextValue
}: WorkingTreeSidebarProps) {
  const { t } = useTranslation(WORKING_TREE_NS)
  const { workingTreeFiles, loadingWorkingTree } = contextValue
  const sections = useMemo(
    () => groupWorkingTreeFiles(workingTreeFiles),
    [workingTreeFiles]
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
    <WorkingTreeContext.Provider value={contextValue}>
      <div
        className={`h-full flex flex-col min-h-0 ${tw.bg.tertiary} ${className}`}
      >
        <CommitBox />

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loadingWorkingTree && workingTreeFiles.length === 0 ? (
            <CenteredMessage>{t('loading')}</CenteredMessage>
          ) : sections.length === 0 ? (
            <CenteredMessage>{t('noWorkingTreeChanges')}</CenteredMessage>
          ) : (
            sections.map((section) => {
              const collapsed = collapsedGroups[section.group]

              return (
                <section key={section.group} className="pb-1">
                  <GroupHeader
                    group={section.group}
                    fileCount={section.files.length}
                    collapsed={collapsed}
                    onToggle={() => toggleGroup(section.group)}
                  />

                  {!collapsed &&
                    section.files.map((file) => (
                      <FileRow key={file.id} file={file} />
                    ))}
                </section>
              )
            })
          )}
        </div>
      </div>
    </WorkingTreeContext.Provider>
  )
}
