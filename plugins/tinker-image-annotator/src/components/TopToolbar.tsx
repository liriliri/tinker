import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { FolderOpen, Image, Save, Undo, Redo, Copy, Check } from 'lucide-react'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import Select, { type SelectOption } from 'share/components/Select'
import { tw } from 'share/theme'
import store from '../store'

interface TopToolbarProps {
  onOpenImage: () => void
  onInsertImage: () => void
}

const STROKE_WIDTH_TOOLS = new Set(['pen', 'line', 'arrow', 'rect', 'ellipse'])

const STROKE_WIDTH_OPTIONS: SelectOption<number>[] = [
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
  { label: '10', value: 10 },
]

const FONT_SIZE_OPTIONS: SelectOption<number>[] = [
  { label: '12', value: 12 },
  { label: '14', value: 14 },
  { label: '16', value: 16 },
  { label: '20', value: 20 },
  { label: '24', value: 24 },
  { label: '28', value: 28 },
  { label: '32', value: 32 },
  { label: '36', value: 36 },
  { label: '40', value: 40 },
  { label: '48', value: 48 },
  { label: '56', value: 56 },
  { label: '64', value: 64 },
  { label: '72', value: 72 },
]

export default observer(function TopToolbar({
  onOpenImage,
  onInsertImage,
}: TopToolbarProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const shouldShowStrokeWidth = STROKE_WIDTH_TOOLS.has(store.tool)
  const shouldShowFontSize =
    store.tool === 'text' || store.isTextSelected || store.isTextEditing

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
        onClick={onInsertImage}
        disabled={!store.hasImage}
        title={t('insertImage')}
      >
        <Image size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.undo()}
        disabled={!store.hasImage}
        title={t('undo')}
      >
        <Undo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.redo()}
        disabled={!store.hasImage}
        title={t('redo')}
      >
        <Redo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      {shouldShowStrokeWidth ? (
        <>
          <ToolbarSeparator />
          <div className="flex items-center gap-1.5 px-1">
            <label
              className={`text-xs whitespace-nowrap ${tw.text.both.secondary}`}
            >
              {t('strokeWidth')}:
            </label>
            <Select
              value={store.strokeWidth}
              onChange={(value) => store.setStrokeWidth(value)}
              options={STROKE_WIDTH_OPTIONS}
              disabled={false}
              title={t('strokeWidth')}
            />
          </div>
        </>
      ) : null}
      {shouldShowFontSize ? (
        <>
          <ToolbarSeparator />
          <div className="flex items-center gap-1.5 px-1">
            <label
              className={`text-xs whitespace-nowrap ${tw.text.both.secondary}`}
            >
              {t('fontSize')}:
            </label>
            <Select
              value={store.fontSize}
              onChange={(value) => store.setFontSize(value)}
              options={FONT_SIZE_OPTIONS}
              disabled={false}
              title={t('fontSize')}
            />
          </div>
        </>
      ) : null}
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
