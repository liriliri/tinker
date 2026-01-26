import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser, Flag } from 'lucide-react'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import CopyButton from 'share/components/CopyButton'
import store from '../store'
import FlagsPanel from './FlagsPanel'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [showFlags, setShowFlags] = useState(false)

  const matchCount = store.matches.length
  const matchText = store.error
    ? store.error
    : matchCount === 0
    ? t('noMatches')
    : t('matchCount', { count: matchCount })

  return (
    <Toolbar>
      <CopyButton
        variant="toolbar"
        text={store.pattern}
        disabled={store.isEmpty}
        title={t('copy')}
      />

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
        className={className(
          'text-xs mr-1 whitespace-nowrap',
          store.error
            ? 'text-red-600 dark:text-red-400'
            : matchCount > 0
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-600 dark:text-gray-400'
        )}
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
