import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser } from 'lucide-react'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarButtonGroup,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import CopyButton from 'share/components/CopyButton'
import store from '../store'

const FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

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

      <ToolbarButtonGroup>
        {FLAGS.map((flag, index) => (
          <ToolbarButton
            key={flag}
            variant="toggle"
            active={store.flags.includes(flag)}
            onClick={() => store.toggleFlag(flag)}
            title={`${flag} - ${t(`flagLabels.${flag}`)}`}
            className={`rounded-none ${index === 0 ? 'rounded-l' : ''} ${
              index === FLAGS.length - 1 ? 'rounded-r' : ''
            } ${
              index < FLAGS.length - 1 ? `border-r ${tw.border}` : ''
            } text-xs w-7 justify-center font-bold`}
          >
            {flag}
          </ToolbarButton>
        ))}
      </ToolbarButtonGroup>
    </Toolbar>
  )
})
