import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { formatCommitListDate } from '../lib/util'
import { parseCommitDiff } from '../lib/parseCommitDiff'
import CenteredMessage from './CenteredMessage'
import store from '../store'

interface CommitDiffBlockViewProps {
  block: ReturnType<typeof parseCommitDiff>[number]
  isCollapsed: boolean
  onToggle: (key: string) => void
}

const CommitDiffBlockView = observer(function CommitDiffBlockView({
  block,
  isCollapsed,
  onToggle,
}: CommitDiffBlockViewProps) {
  const { t } = useTranslation()

  return (
    <div className={`rounded border overflow-hidden ${tw.border}`}>
      <Toolbar className="justify-between gap-3 border-b-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ToolbarButton
            variant="action"
            onClick={() => onToggle(block.key)}
            title={isCollapsed ? t('expand') : t('collapse')}
          >
            {isCollapsed ? (
              <ChevronRight size={TOOLBAR_ICON_SIZE} />
            ) : (
              <ChevronDown size={TOOLBAR_ICON_SIZE} />
            )}
          </ToolbarButton>
          <span
            className={`text-xs font-mono truncate min-w-0 flex-1 ${tw.text.primary}`}
            title={block.title}
          >
            {block.title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <span className="text-green-600 dark:text-green-400">
            +{block.additions}
          </span>
          <span className="text-red-600 dark:text-red-400">
            -{block.deletions}
          </span>
          {block.isBinary && (
            <span className={`text-[11px] ${tw.text.secondary}`}>Binary</span>
          )}
        </div>
      </Toolbar>

      {!isCollapsed && (
        <pre
          className={`m-0 border-t ${tw.border} px-3 py-3 font-mono text-xs leading-5 whitespace-pre-wrap break-words ${tw.text.primary}`}
        >
          {block.body}
        </pre>
      )}
    </div>
  )
})

export default observer(function CommitEditor() {
  const { t } = useTranslation()
  const commit = store.selectedCommit
  const detail = store.commitDetail
  const [collapsedBlocks, setCollapsedBlocks] = useState<
    Record<string, boolean>
  >({})
  const diffBlocks = useMemo(
    () => parseCommitDiff(detail?.diff ?? ''),
    [detail?.diff]
  )

  const handleToggleBlock = (key: string) => {
    setCollapsedBlocks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (!commit) {
    return <CenteredMessage>{t('selectCommitHint')}</CenteredMessage>
  }

  const { label: dateLabel, title: dateTitle } = formatCommitListDate(
    commit.date
  )

  const handleCopySha = async () => {
    try {
      await navigator.clipboard.writeText(commit.sha)
      toast.success(t('copySuccess'))
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className="h-full w-full flex flex-col min-w-0">
      <Toolbar className="min-w-0 overflow-hidden gap-2">
        <span className={`text-xs shrink-0 ${tw.text.secondary}`}>
          {commit.author}
        </span>
        <span
          className={`text-xs truncate min-w-0 flex-1 ${tw.text.primary}`}
          title={commit.summary}
        >
          {commit.summary}
        </span>
        <span
          onClick={handleCopySha}
          className={`font-mono text-xs shrink-0 ${tw.text.secondary} ${tw.primary.textHover} cursor-pointer transition-colors`}
          title={t('clickToCopy')}
        >
          {commit.shortSha}
        </span>
        <span
          className={`text-xs shrink-0 tabular-nums ${tw.text.secondary}`}
          title={dateTitle}
        >
          {dateLabel}
        </span>
      </Toolbar>

      {store.loadingDetail ? (
        <CenteredMessage>{t('loading')}</CenteredMessage>
      ) : diffBlocks.length === 0 ? (
        <CenteredMessage>{t('noDiffs')}</CenteredMessage>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          {diffBlocks.map((block) => (
            <CommitDiffBlockView
              key={block.key}
              block={block}
              isCollapsed={Boolean(collapsedBlocks[block.key])}
              onToggle={handleToggleBlock}
            />
          ))}
        </div>
      )}
    </div>
  )
})
