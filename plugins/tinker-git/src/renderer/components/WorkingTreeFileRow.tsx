import { type KeyboardEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import type { GitWorkingTreeFile } from 'share/types/git'
import FileIcon from 'share/components/FileIcon'
import { confirm } from 'share/components/Confirm'
import { joinPath } from 'share/lib/util'
import { tw } from 'share/theme'
import {
  statusLetterClass,
  fileDisplayName,
  fileDirectoryName,
  getWorkingTreeFileActions,
  type WorkingTreeActionId,
} from '../lib/workingTree'
import WorkingTreeActionButtons from './WorkingTreeActionButtons'
import store from '../store'

export interface WorkingTreeFileRowProps {
  file: GitWorkingTreeFile
}

export default observer(function WorkingTreeFileRow({
  file,
}: WorkingTreeFileRowProps) {
  const { t } = useTranslation()
  const selected = store.selectedWorkingTreeFile?.id === file.id
  const name = fileDisplayName(file)
  const directory = fileDirectoryName(file)
  const actions = getWorkingTreeFileActions(file)

  const handleSelect = () => {
    void store.selectWorkingTreeFile(file)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect()
    }
  }

  const handleAction = async (actionId: WorkingTreeActionId) => {
    if (actionId === 'reveal') {
      if (!store.repoPath) return
      tinker.showItemInPath(joinPath(store.repoPath, file.path))
      return
    }

    if (actionId === 'discard') {
      const confirmed = await confirm({
        title: t('discardFileTitle'),
        message: t('discardFileMessage', { file: name }),
        confirmText: t('discard'),
      })
      if (!confirmed) return
      await store.discardWorkingTreeFile(file)
      return
    }

    if (actionId === 'stage') {
      await store.stageWorkingTreeFile(file)
      return
    }

    if (actionId === 'unstage') {
      await store.unstageWorkingTreeFile(file)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group flex items-center gap-1.5 pl-5 pr-1 py-1 text-xs min-w-0 cursor-pointer ${
        selected ? tw.active : tw.hover
      }`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-1 items-center gap-1.5 min-w-0">
        <FileIcon
          name={name}
          isDark={store.isDark}
          size={16}
          className="shrink-0"
        />
        <span className="min-w-0 flex-1 truncate" title={file.path}>
          <span className={tw.text.primary}>{name}</span>
          {directory && (
            <span className={`ml-1 ${tw.text.tertiary}`}>{directory}</span>
          )}
        </span>
      </div>

      <div className="shrink-0 flex items-center justify-end h-5 pr-0.5">
        <span
          className={`w-4 text-right font-mono font-semibold group-hover:hidden ${statusLetterClass(
            file.status
          )}`}
          aria-hidden
        >
          {file.statusLetter}
        </span>
        <WorkingTreeActionButtons actions={actions} onAction={handleAction} />
      </div>
    </div>
  )
})
