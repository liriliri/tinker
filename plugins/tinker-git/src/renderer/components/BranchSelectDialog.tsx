import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import lowerCase from 'licia/lowerCase'
import trim from 'licia/trim'
import Dialog from 'share/components/Dialog'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import type { GitBranch, GitRefKind } from '../../common/types'
import { formatRefLabel } from '../lib/util'
import store from '../store'

interface BranchSelectDialogProps {
  open: boolean
  onClose: () => void
}

const TAB_ORDER: GitRefKind[] = ['local', 'remote', 'tag']

function matchesQuery(ref: GitBranch, query: string): boolean {
  if (!query) return true
  const q = lowerCase(query)
  return lowerCase(ref.name).includes(q) || lowerCase(ref.fullName).includes(q)
}

function filterRefs(
  refs: GitBranch[],
  kind: GitRefKind,
  query: string
): GitBranch[] {
  const normalized = lowerCase(trim(query))
  return refs.filter(
    (ref) => ref.kind === kind && matchesQuery(ref, normalized)
  )
}

export default observer(function BranchSelectDialog({
  open,
  onClose,
}: BranchSelectDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<GitRefKind>('local')

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveTab('local')
    }
  }, [open])

  const tabLabels: Record<GitRefKind, string> = useMemo(
    () => ({
      local: t('branchTab'),
      remote: t('remoteTab'),
      tag: t('tagTab'),
    }),
    [t]
  )

  const filteredRefs = useMemo(
    () => filterRefs(store.branches, activeTab, query),
    [store.branches, activeTab, query]
  )

  const handleSelect = (ref: GitBranch) => {
    store.selectBranch(ref)
    onClose()
  }

  const emptyByTab: Record<GitRefKind, string> = {
    local: t('noLocalRefs'),
    remote: t('noRemoteRefs'),
    tag: t('noTagRefs'),
  }
  const emptyMessage =
    trim(query) !== '' ? t('noSearchResults') : emptyByTab[activeTab]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('branches')}
      className="w-[480px] h-[70vh] max-w-[90vw] max-h-[90vh]"
    >
      <div className="flex flex-col h-full min-h-0 gap-3">
        <div className="relative shrink-0 p-px">
          <Search
            size={14}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${tw.text.tertiary}`}
          />
          <TextInput
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchRefs')}
            autoFocus
          />
        </div>

        <div className={`flex shrink-0 border-b ${tw.border}`}>
          {TAB_ORDER.map((tab) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2 text-sm transition-colors ${
                  active
                    ? `${tw.primary.text} border-b-2 ${tw.primary.border} -mb-px`
                    : `${tw.text.secondary} ${tw.hover}`
                }`}
              >
                {tabLabels[tab]}
              </button>
            )
          })}
        </div>

        <div
          className={`flex-1 min-h-0 overflow-y-auto rounded-md px-1 py-1 ${tw.bg.tertiary}`}
        >
          {filteredRefs.length === 0 ? (
            <p className={`text-sm py-4 text-center ${tw.text.secondary}`}>
              {emptyMessage}
            </p>
          ) : (
            filteredRefs.map((ref) => {
              const selected = store.selectedBranch?.fullName === ref.fullName
              return (
                <button
                  key={ref.fullName}
                  type="button"
                  onClick={() => handleSelect(ref)}
                  disabled={store.loading}
                  className={`w-full text-left px-3 py-2 rounded ${tw.hover} ${
                    selected ? tw.active : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-sm truncate flex-1 ${tw.text.primary}`}
                    >
                      {formatRefLabel(ref.name, ref.isHead)}
                    </span>
                    <span
                      className={`font-mono text-xs shrink-0 ${tw.text.secondary}`}
                    >
                      {ref.sha}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </Dialog>
  )
})
