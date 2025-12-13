import { observer } from 'mobx-react-lite'
import { ListX, Eraser, Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

  const getCurrentLine = () => {
    return find(store.lines, (line) => line.id === store.activeLineId)
  }

  const handleClearCurrentLine = () => {
    store.updateExpression(store.activeLineId, '')
  }

  const isCurrentLineEmpty = () => {
    const currentLine = getCurrentLine()
    return !currentLine || isStrBlank(currentLine.expression)
  }

  const handleCopyResult = async () => {
    const currentLine = getCurrentLine()
    if (currentLine && currentLine.result) {
      await copyToClipboard(currentLine.result)
    }
  }

  const hasResult = () => {
    const currentLine = getCurrentLine()
    return currentLine && !isStrBlank(currentLine.result)
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleClearCurrentLine}
        disabled={isCurrentLineEmpty()}
        title={t('clearCurrent')}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleCopyResult}
        disabled={!hasResult()}
        className={copied ? 'text-[#0fc25e]' : ''}
        title={t('copyResult')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarSpacer />

      <ToolbarButton
        onClick={() => store.clear()}
        disabled={store.isEmpty}
        title={t('clear')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
