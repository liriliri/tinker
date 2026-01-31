import { observer } from 'mobx-react-lite'
import { ListX, Eraser } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import CopyButton from 'share/components/CopyButton'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

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

  const hasResult = () => {
    const currentLine = getCurrentLine()
    return currentLine && !isStrBlank(currentLine.result)
  }

  const getCurrentResult = () => {
    const currentLine = getCurrentLine()
    return currentLine?.result || ''
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

      <CopyButton
        variant="toolbar"
        text={getCurrentResult()}
        disabled={!hasResult()}
        title={t('copyResult')}
      />

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
