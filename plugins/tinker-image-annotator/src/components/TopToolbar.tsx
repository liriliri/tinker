import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { FolderOpen, Save, Undo, Copy, Check } from 'lucide-react'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { tw } from 'share/theme'
import store from '../store'

interface TopToolbarProps {
  onOpenImage: () => void
}

export default observer(function TopToolbar({ onOpenImage }: TopToolbarProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!store.hasImage) return
    const result = await store.copyToClipboard()
    if (result) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={onOpenImage} title={t('open')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.clearAnnotations()}
        disabled={!store.hasImage}
        title={t('clear')}
      >
        <Undo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarButton
        onClick={handleCopy}
        disabled={!store.hasImage}
        className={className(copied && tw.primary.text)}
        title={t('copy')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.saveToFile()}
        disabled={!store.hasImage}
        title={t('save')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
