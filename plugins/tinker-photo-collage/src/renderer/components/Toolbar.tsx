import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Shuffle, Save, X, Copy, Check } from 'lucide-react'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { tw } from 'share/theme'
import * as htmlToImage from 'html-to-image'
import store from '../store'
import CanvasSizeDialog from './CanvasSizeDialog'

export default observer(() => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [showSizeDialog, setShowSizeDialog] = useState(false)

  const handleCopy = async () => {
    const canvasElement = document.getElementById('collage-canvas')
    if (!canvasElement) {
      console.error('Canvas element not found')
      return
    }

    try {
      const blob = await htmlToImage.toBlob(canvasElement, {
        pixelRatio: 2,
      })

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ])

        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy image:', error)
    }
  }

  const handleSave = async () => {
    const canvasElement = document.getElementById('collage-canvas')
    if (!canvasElement) {
      console.error('Canvas element not found')
      return
    }

    try {
      const dataUrl = await htmlToImage.toPng(canvasElement, {
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = 'photo-collage.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to save image:', error)
    }
  }

  const handleSetCanvasSize = (width: number, height: number) => {
    store.setCanvasSize(width, height)
  }

  return (
    <>
      <Toolbar>
        <ToolbarButton onClick={() => store.randomize()} title={t('random')}>
          <Shuffle size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton onClick={() => store.clearAll()} title={t('clearAll')}>
          <X size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <div className="flex items-center gap-1.5 px-1">
          <label
            className={`text-xs ${tw.text.both.secondary} whitespace-nowrap`}
          >
            {t('canvasBackground')}:
          </label>
          <input
            type="color"
            value={store.canvasBgColor}
            onChange={(e) => store.setCanvasBgColor(e.target.value)}
            className="h-5 w-10 cursor-pointer rounded border-0"
          />
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <label
            className={`text-xs ${tw.text.both.secondary} whitespace-nowrap`}
          >
            {t('imageBackground')}:
          </label>
          <input
            type="color"
            value={store.imageBgColor}
            onChange={(e) => store.setImageBgColor(e.target.value)}
            className="h-5 w-10 cursor-pointer rounded border-0"
          />
        </div>

        <ToolbarSpacer />

        <button
          className={`text-xs px-2 py-1 ${tw.bg.light.hoverSecondary} ${tw.bg.dark.hoverTertiary} rounded transition-colors cursor-pointer`}
          onClick={() => setShowSizeDialog(true)}
          title={t('setCanvasSize')}
        >
          <div>
            {store.canvasWidth} × {store.canvasHeight}
          </div>
        </button>

        <ToolbarButton
          onClick={handleCopy}
          className={copied ? tw.primary.text : ''}
          title={t('copyImage')}
        >
          {copied ? (
            <Check size={TOOLBAR_ICON_SIZE} />
          ) : (
            <Copy size={TOOLBAR_ICON_SIZE} />
          )}
        </ToolbarButton>

        <ToolbarButton onClick={handleSave} title={t('save')}>
          <Save size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>

      <CanvasSizeDialog
        open={showSizeDialog}
        onClose={() => setShowSizeDialog(false)}
        onConfirm={handleSetCanvasSize}
        currentWidth={store.canvasWidth}
        currentHeight={store.canvasHeight}
      />
    </>
  )
})
