import { type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderGit2 } from 'lucide-react'
import type { GitWorkingTreeFile } from '../../types/git'
import FileIcon from '../FileIcon'
import { confirm } from '../Confirm'
import { tw } from '../../theme'
import {
  statusLetterClass,
  fileDisplayName,
  fileDirectoryName,
  getWorkingTreeFileActions,
  isSubmoduleWorkingTreeFile,
  type WorkingTreeActionId,
} from '../../lib/workingTree'
import ActionButtons from './ActionButtons'
import { useWorkingTreeContext } from './context'
import { WORKING_TREE_NS } from './i18n'

export interface FileRowProps {
  file: GitWorkingTreeFile
}

export default function FileRow({ file }: FileRowProps) {
  const { t } = useTranslation(WORKING_TREE_NS)
  const {
    selectedWorkingTreeFileId,
    isDark,
    revealTitleKey,
    revealIcon,
    onSelectFile,
    onStageFile,
    onUnstageFile,
    onDiscardFile,
    onRevealFile,
  } = useWorkingTreeContext()

  const selected = selectedWorkingTreeFileId === file.id
  const name = fileDisplayName(file)
  const directory = fileDirectoryName(file)
  const actions = getWorkingTreeFileActions(file).map((action) =>
    action.id === 'reveal' && revealTitleKey
      ? { ...action, titleKey: revealTitleKey }
      : action
  )

  const handleSelect = () => {
    void onSelectFile(file)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSelect()
    }
  }

  const handleAction = async (actionId: WorkingTreeActionId) => {
    if (actionId === 'reveal') {
      onRevealFile(file)
      return
    }

    if (actionId === 'discard') {
      const confirmed = await confirm({
        title: t('discardFileTitle'),
        message: t('discardFileMessage', { file: name }),
        confirmText: t('discard'),
      })
      if (!confirmed) return
      await onDiscardFile(file)
      return
    }

    if (actionId === 'stage') {
      await onStageFile(file)
      return
    }

    if (actionId === 'unstage') {
      await onUnstageFile(file)
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
        {isSubmoduleWorkingTreeFile(file) ? (
          <FolderGit2 size={16} className={`shrink-0 ${tw.text.secondary}`} />
        ) : (
          <FileIcon
            name={name}
            isDark={isDark}
            size={16}
            className="shrink-0"
          />
        )}
        <span className="min-w-0 flex-1 truncate" title={file.path}>
          <span className={tw.text.primary}>{name}</span>
          {directory && (
            <span className={`ml-1 ${tw.text.tertiary}`}>{directory}</span>
          )}
        </span>
      </div>

      <div className="shrink-0 flex items-center justify-end gap-0.5 h-5 pr-0.5">
        <ActionButtons
          actions={actions}
          onAction={handleAction}
          revealIcon={revealIcon}
        />
        <span
          className={`w-4 text-right font-mono font-semibold ${statusLetterClass(
            file.status
          )}`}
          aria-hidden
        >
          {file.statusLetter}
        </span>
      </div>
    </div>
  )
}
