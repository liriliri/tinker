import { addI18nNamespace } from '../../lib/i18n'

export const WORKING_TREE_NS = 'workingTree'

const enUS = {
  loading: 'Loading...',
  noDiffs: 'No diffs found',
  diffUnrenderable: 'The diff is too large to be displayed.',
  binaryDiffNotSupported: 'Binary file diff is not supported.',
  noWorkingTreeChanges: 'No changes in working tree',
  mergeChanges: 'Merge Changes',
  stagedChanges: 'Staged Changes',
  changes: 'Changes',
  stage: 'Stage Changes',
  unstage: 'Unstage Changes',
  discard: 'Discard Changes',
  revealInFolder: 'Reveal in Finder',
  openInEditor: 'Open in Editor',
  discardFileTitle: 'Discard Changes',
  discardFileMessage:
    'Are you sure you want to discard changes in "{{file}}"? This cannot be undone.',
  stageAll: 'Stage All Changes',
  unstageAll: 'Unstage All Changes',
  discardAll: 'Discard All Changes',
  discardAllTitle: 'Discard All Changes',
  discardAllMessage:
    'Are you sure you want to discard all {{count}} files in "{{group}}"? This cannot be undone.',
  commit: 'Commit',
  committing: 'Committing...',
  commitMessagePlaceholder: 'Message ({{shortcut}} to commit)',
  commitMessagePlaceholderBranch:
    'Message ({{shortcut}} to commit on "{{branch}}")',
}

const zhCN = {
  loading: '加载中...',
  noDiffs: '未找到 diff',
  diffUnrenderable: '差异过大，无法显示。',
  binaryDiffNotSupported: '不支持显示二进制文件差异。',
  noWorkingTreeChanges: '工作区没有变更',
  mergeChanges: '合并变更',
  stagedChanges: '已暂存变更',
  changes: '变更',
  stage: '暂存变更',
  unstage: '取消暂存',
  discard: '丢弃变更',
  revealInFolder: '在访达中显示',
  openInEditor: '在编辑器中打开',
  discardFileTitle: '丢弃变更',
  discardFileMessage: '确定要丢弃 "{{file}}" 中的变更吗？此操作无法撤销。',
  stageAll: '暂存全部变更',
  unstageAll: '取消暂存全部',
  discardAll: '丢弃全部变更',
  discardAllTitle: '丢弃全部变更',
  discardAllMessage:
    '确定要丢弃 "{{group}}" 中的全部 {{count}} 个文件吗？此操作无法撤销。',
  commit: '提交',
  committing: '提交中...',
  commitMessagePlaceholder: '提交信息（{{shortcut}} 提交）',
  commitMessagePlaceholderBranch:
    '提交信息（{{shortcut}} 提交到 "{{branch}}"）',
}

addI18nNamespace(WORKING_TREE_NS, { 'en-US': enUS, 'zh-CN': zhCN })
