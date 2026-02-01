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

  const currentLine = find(
    store.lines,
    (line) => line.id === store.activeLineId
  )
  const isCurrentLineEmpty = !currentLine || isStrBlank(currentLine.expression)
  const hasResult = !!currentLine && !isStrBlank(currentLine.result)
  const currentResult = currentLine?.result || ''

  const handleClearCurrentLine = () => {
    store.updateExpression(store.activeLineId, '')
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleClearCurrentLine}
        disabled={isCurrentLineEmpty}
        title={t('clearCurrent')}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <CopyButton
        variant="toolbar"
        text={currentResult}
        disabled={!hasResult}
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
