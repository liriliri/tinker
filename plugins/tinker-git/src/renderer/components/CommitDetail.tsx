import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { formatRelativeDate } from 'share/lib/util'
import { isDiffTextUnrenderable } from '../lib/diffLimits'
import {
  parseCommitDiff,
  type CommitDiffLine,
  type CommitDiffLineType,
} from '../lib/parseCommitDiff'
import CenteredMessage from './CenteredMessage'
import store from '../store'

function diffLineBackground(type: CommitDiffLineType): string {
  switch (type) {
    case 'add':
      return tw.diff.addLine
    case 'delete':
      return tw.diff.deleteLine
    default:
      return ''
  }
}

function diffLinePrefix(type: CommitDiffLineType): string {
  switch (type) {
    case 'add':
      return '+'
    case 'delete':
      return '-'
    default:
      return ' '
  }
}

function CommitDiffLineView({ line }: { line: CommitDiffLine }) {
  return (
    <div
      className={`flex min-w-0 ${diffLineBackground(line.type)} ${
        tw.text.primary
      }`}
    >
      <span
        className={`shrink-0 w-6 text-center select-none ${tw.diff.prefix}`}
        aria-hidden
      >
        {diffLinePrefix(line.type)}
      </span>
      <span className="flex-1 min-w-0 whitespace-pre-wrap break-words">
        {line.content.length > 0 ? line.content : '\u00a0'}
      </span>
    </div>
  )
}

interface CommitDiffBlockViewProps {
  block: ReturnType<typeof parseCommitDiff>[number]
  isCollapsed: boolean
  isLargeExpanded: boolean
  onToggle: (key: string) => void
  onShowLargeDiff: (key: string) => void
}

const CommitDiffBlockView = observer(function CommitDiffBlockView({
  block,
  isCollapsed,
  isLargeExpanded,
  onToggle,
  onShowLargeDiff,
}: CommitDiffBlockViewProps) {
  const { t } = useTranslation()
  const showLargePlaceholder =
    block.isLarge && !isLargeExpanded && !block.isBinary

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
          <span className={tw.diff.statAdd}>+{block.additions}</span>
          <span className={tw.diff.statDelete}>-{block.deletions}</span>
          {block.isBinary && (
            <span className={`text-[11px] ${tw.text.secondary}`}>Binary</span>
          )}
        </div>
      </Toolbar>

      {!isCollapsed && showLargePlaceholder && (
        <div
          className={`border-t ${tw.border} px-4 py-6 flex flex-col items-center gap-3 text-center`}
        >
          <p className={`text-sm ${tw.text.primary}`}>{t('diffTooLarge')}</p>
          <p className={`text-xs max-w-md ${tw.text.secondary}`}>
            {t('diffTooLargeHint')}
          </p>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white transition-colors cursor-pointer`}
            onClick={() => onShowLargeDiff(block.key)}
          >
            {t('showDiff')}
          </button>
        </div>
      )}

      {!isCollapsed && !showLargePlaceholder && (
        <div
          className={`border-t ${tw.border} px-3 py-3 font-mono text-xs leading-5`}
        >
          {block.lines.map((line, index) => (
            <CommitDiffLineView key={index} line={line} />
          ))}
        </div>
      )}
    </div>
  )
})

export default observer(function CommitDetail() {
  const { t, i18n } = useTranslation()
  const commit = store.selectedCommit
  const detail = store.commitDetail
  const [collapsedBlocks, setCollapsedBlocks] = useState<
    Record<string, boolean>
  >({})
  const [expandedLargeBlocks, setExpandedLargeBlocks] = useState<
    Record<string, boolean>
  >({})
  const diffText = detail?.diff ?? ''
  const diffUnrenderable = useMemo(
    () => isDiffTextUnrenderable(diffText),
    [diffText]
  )
  const diffBlocks = useMemo(
    () => (diffUnrenderable ? [] : parseCommitDiff(diffText)),
    [diffText, diffUnrenderable]
  )

  useEffect(() => {
    setCollapsedBlocks({})
    setExpandedLargeBlocks({})
  }, [commit?.sha])

  const handleToggleBlock = (key: string) => {
    setCollapsedBlocks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleShowLargeDiff = (key: string) => {
    setExpandedLargeBlocks((prev) => ({
      ...prev,
      [key]: true,
    }))
  }

  if (!commit) {
    return <CenteredMessage>{t('selectCommitHint')}</CenteredMessage>
  }

  const { label: dateLabel, title: dateTitle } = formatRelativeDate(
    commit.date,
    i18n.language
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
      <Toolbar className="min-w-0 overflow-hidden">
        <span className={`text-xs shrink-0 ${tw.text.secondary}`}>
          {commit.author}
        </span>
        <span
          className={`text-xs truncate min-w-0 flex-1 ${tw.text.primary}`}
          title={commit.summary}
        >
          {commit.summary}
        </span>
        <ToolbarSpacer />
        <span
          onClick={handleCopySha}
          className={`font-mono text-xs shrink-0 ${tw.text.secondary} ${tw.primary.textHover} cursor-pointer transition-colors`}
          title={t('clickToCopy')}
        >
          {commit.shortSha}
        </span>
        <span
          className={`text-xs shrink-0 ${tw.text.secondary}`}
          title={dateTitle}
        >
          {dateLabel}
        </span>
        <ToolbarSeparator />
        <ToolbarButton
          variant="action"
          onClick={() => store.setBrowsingFiles(true)}
          title={t('browseFiles')}
        >
          <Folder size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>

      {store.loadingDetail ? (
        <CenteredMessage>{t('loading')}</CenteredMessage>
      ) : diffUnrenderable ? (
        <CenteredMessage>{t('diffUnrenderable')}</CenteredMessage>
      ) : diffBlocks.length === 0 ? (
        <CenteredMessage>{t('noDiffs')}</CenteredMessage>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          {diffBlocks.map((block) => (
            <CommitDiffBlockView
              key={block.key}
              block={block}
              isCollapsed={Boolean(collapsedBlocks[block.key])}
              isLargeExpanded={Boolean(expandedLargeBlocks[block.key])}
              onToggle={handleToggleBlock}
              onShowLargeDiff={handleShowLargeDiff}
            />
          ))}
        </div>
      )}
    </div>
  )
})
