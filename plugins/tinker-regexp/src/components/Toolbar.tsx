import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Clipboard, Eraser, Check, Flag } from 'lucide-react'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { tw } from 'share/theme'
import store from '../store'
import FlagsPanel from './FlagsPanel'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()
  const [showFlags, setShowFlags] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(store.pattern)
  }

  const matchCount = store.matches.length
  const matchText = store.error
    ? store.error
    : matchCount === 0
    ? t('noMatches')
    : t('matchCount', { count: matchCount })

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleCopy}
        disabled={store.isEmpty}
        className={copied ? tw.primary.text : ''}
        title={t('copy')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.pasteFromClipboard()}
        title={t('paste')}
      >
        <Clipboard size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.clearPattern()}
        disabled={store.isEmpty}
        title={t('clear')}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />
      <div
        className={`text-xs mr-1 whitespace-nowrap ${
          store.error
            ? 'text-red-600 dark:text-red-400'
            : matchCount > 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {matchText}
      </div>

      <div className="relative">
        <ToolbarButton
          onClick={() => setShowFlags(!showFlags)}
          title={t('flags')}
        >
          <Flag size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        {showFlags && (
          <>
            <div
              className="fixed inset-0 z-[5]"
              onClick={() => setShowFlags(false)}
            />
            <FlagsPanel />
          </>
        )}
      </div>
    </Toolbar>
  )
})
