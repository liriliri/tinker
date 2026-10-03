import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser, Sparkles } from 'lucide-react'
import isStrBlank from 'licia/isStrBlank'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import CopyButton from 'share/components/CopyButton'
import { LoadingCircle } from 'share/components/Loading'
import store from '../store'

export default observer(function PromptToolbar() {
  const { t } = useTranslation()
  const empty = isStrBlank(store.prompt)

  return (
    <Toolbar>
      <CopyButton
        variant="toolbar"
        text={store.prompt}
        disabled={empty}
        title={t('copy')}
      />
      <ToolbarButton
        onClick={() => void store.pastePrompt()}
        title={t('paste')}
      >
        <Clipboard size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.clearPrompt()}
        disabled={empty}
        title={t('clear')}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      {store.hasAI && (
        <>
          <ToolbarSpacer />
          <ToolbarButton
            onClick={() => void store.optimizePrompt()}
            disabled={empty || store.isOptimizingPrompt}
            title={t('optimizePrompt')}
          >
            {store.isOptimizingPrompt ? (
              <LoadingCircle className="w-3.5 h-3.5" />
            ) : (
              <Sparkles size={TOOLBAR_ICON_SIZE} />
            )}
          </ToolbarButton>
        </>
      )}
    </Toolbar>
  )
})
