import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState, type ChangeEvent } from 'react'
import {
  FolderOpen,
  Image,
  Save,
  Undo,
  Redo,
  Copy,
  Check,
  Square,
  Circle,
  Minus,
  ArrowRight,
} from 'lucide-react'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarColor,
} from 'share/components/Toolbar'
import Select, { type SelectOption } from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import { openImageFile } from 'share/lib/util'
import { tw } from 'share/theme'
import store, { type ShapeType } from '../store'

const STROKE_WIDTH_TOOLS = new Set(['pen', 'shape'])

const STROKE_WIDTH_OPTIONS: SelectOption<number>[] = [
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
  { label: '10', value: 10 },
  { label: '12', value: 12 },
  { label: '14', value: 14 },
  { label: '16', value: 16 },
  { label: '18', value: 18 },
  { label: '20', value: 20 },
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

const SHAPE_TYPE_CONFIGS: Record<
  ShapeType,
  { icon: typeof Square; labelKey: string }
> = {
  rect: { icon: Square, labelKey: 'rect' },
  ellipse: { icon: Circle, labelKey: 'ellipse' },
  line: { icon: Minus, labelKey: 'line' },
  arrow: { icon: ArrowRight, labelKey: 'arrow' },
}

export default observer(function TopToolbar() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const shouldShowStrokeWidth = STROKE_WIDTH_TOOLS.has(store.tool)
  const shouldShowShapeSelector = store.tool === 'shape'
  const shouldShowFontSize =
    store.tool === 'text' || store.isTextSelected || store.isTextEditing

  const captureScreenToFile = async (): Promise<File | null> => {
    const dataUrl = await tinker.captureScreen()
    if (!dataUrl) return null

    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      return new File([blob], 'screenshot.png', { type: 'image/png' })
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      return null
    }
  }

  const pasteImageFromClipboard = async (): Promise<File | null> => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            return new File([blob], 'clipboard.png', { type })
          }
        }
      }
      return null
    } catch (error) {
      console.error('Failed to paste image from clipboard:', error)
      return null
    }
  }

  const handleOpenImage = async () => {
    const result = await openImageFile({ title: t('open') })
    if (result) {
      store.loadImage(result.file)
    }
  }

  const handleCaptureScreen = async () => {
    const file = await captureScreenToFile()
    if (file) {
      store.loadImage(file)
    }
  }

  const handlePasteImage = async () => {
    const file = await pasteImageFromClipboard()
    if (file) {
      store.loadImage(file)
    }
  }

  const handleInsertImage = async () => {
    const result = await openImageFile({ title: t('insertImage') })
    if (result) {
      store.addImageOverlay(result.file)
    }
  }

  const handleInsertScreen = async () => {
    const file = await captureScreenToFile()
    if (file) {
      store.addImageOverlay(file)
    }
  }

  const handlePasteInsertImage = async () => {
    const file = await pasteImageFromClipboard()
    if (file) {
      store.addImageOverlay(file)
    }
  }

  const handleCopy = async () => {
    if (!store.hasImage) return
    const result = await store.copyToClipboard()
    if (result) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWatermarkTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    store.setWatermarkText(event.target.value)
  }

  const handleWatermarkColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    store.setWatermarkColor(event.target.value)
  }

  const handleWatermarkToggle = (checked: boolean) => {
    store.setWatermarkEnabled(checked)
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleOpenImage}
        menu={[
          {
            label: t('captureScreen'),
            click: () => handleCaptureScreen(),
          },
          {
            label: t('pasteImage'),
            click: () => handlePasteImage(),
          },
        ]}
        title={t('open')}
      >
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleInsertImage}
        menu={[
          {
            label: t('captureScreen'),
            click: () => handleInsertScreen(),
          },
          {
            label: t('pasteImage'),
            click: () => handlePasteInsertImage(),
          },
        ]}
        disabled={!store.hasImage}
        title={t('insertImage')}
      >
        <Image size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        onClick={() => store.undo()}
        disabled={!store.canUndo}
        title={t('undo')}
      >
        <Undo size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.redo()}
        disabled={!store.canRedo}
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
      {shouldShowShapeSelector ? (
        <>
          <ToolbarSeparator />
          <div className="flex items-center gap-1.5 px-1">
            {(Object.keys(SHAPE_TYPE_CONFIGS) as ShapeType[]).map((shape) => {
              const config = SHAPE_TYPE_CONFIGS[shape]
              const Icon = config.icon
              return (
                <ToolbarButton
                  key={shape}
                  variant="toggle"
                  active={store.shapeType === shape}
                  onClick={() => store.setShapeType(shape)}
                  title={t(config.labelKey)}
                >
                  <Icon size={TOOLBAR_ICON_SIZE} />
                </ToolbarButton>
              )
            })}
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
      <div className="flex items-center gap-2 px-2">
        <Checkbox
          checked={store.watermarkEnabled}
          onChange={handleWatermarkToggle}
        >
          {t('watermark')}
        </Checkbox>
        <ToolbarColor
          value={store.watermarkColor}
          onChange={handleWatermarkColorChange}
          disabled={!store.watermarkEnabled}
          title={t('watermarkColor')}
          aria-label={t('watermarkColor')}
        />
        <ToolbarTextInput
          value={store.watermarkText}
          onChange={handleWatermarkTextChange}
          disabled={!store.watermarkEnabled}
          placeholder={t('watermarkTextPlaceholder')}
          className={`h-7 w-24 px-2 text-xs ${tw.bg.input} ${tw.primary.focusBorder} disabled:opacity-50`}
          title={t('watermarkTextPlaceholder')}
        />
      </div>
      <ToolbarSeparator />
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
