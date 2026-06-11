import { type KeyboardEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { tw } from 'share/theme'
import { getCommitShortcutLabel, isCommitShortcutKey } from '../lib/workingTree'
import store from '../store'

export default observer(function WorkingTreeCommitBox() {
  const { t } = useTranslation()
  const branchName = store.checkoutInfo?.branchName
  const shortcut = getCommitShortcutLabel()
  const canCommit =
    store.hasStagedChanges &&
    store.commitMessage.trim().length > 0 &&
    !store.committing &&
    !store.workingTreeMutating

  const placeholder = branchName
    ? t('commitMessagePlaceholderBranch', {
        shortcut,
        branch: branchName,
      })
    : t('commitMessagePlaceholder', { shortcut })

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCommitShortcutKey(event)) return

    event.preventDefault()
    if (!canCommit) return
    void store.commitWorkingTree()
  }

  return (
    <div
      className={`shrink-0 border-b p-2 space-y-2 ${tw.border} ${tw.bg.secondary}`}
    >
      <textarea
        value={store.commitMessage}
        onChange={(event) => store.setCommitMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        disabled={store.committing}
        className={`w-full resize-none px-2 py-1.5 text-xs rounded border ${tw.border} ${tw.bg.input} ${tw.text.primary} placeholder:${tw.text.tertiary} focus:outline-none focus:ring-1 ${tw.primary.focusRing} disabled:opacity-60`}
      />
      <button
        type="button"
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded text-white disabled:cursor-not-allowed ${
          canCommit ? `${tw.primary.bg} ${tw.primary.bgHover}` : tw.secondary.bg
        }`}
        disabled={!canCommit}
        onClick={() => void store.commitWorkingTree()}
      >
        <Check size={14} />
        {store.committing ? t('committing') : t('commit')}
      </button>
    </div>
  )
})
