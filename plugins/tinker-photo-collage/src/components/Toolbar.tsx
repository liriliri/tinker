import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Shuffle, Save, X, Copy, Check, Image, ImageOff } from 'lucide-react'
import openFile from 'licia/openFile'
import download from 'licia/download'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarColor,
  ToolbarLabel,
} from 'share/components/Toolbar'
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
        pixelRatio: 1,
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
      const blob = await htmlToImage.toBlob(canvasElement, {
        pixelRatio: 1,
      })

      if (blob) {
        download(blob, 'photo-collage.png')
      }
    } catch (error) {
      console.error('Failed to save image:', error)
    }
  }

  const handleSetCanvasSize = (width: number, height: number) => {
    store.setCanvasSize(width, height)
  }

  const handleSetBackgroundImage = async () => {
    try {
      const files = await openFile({ accept: 'image/*' })
      if (files && files.length > 0) {
        const url = URL.createObjectURL(files[0])
        store.setBackgroundImage(url)
      }
    } catch (err) {
      console.error('Failed to open background image:', err)
    }
  }

  const handleClearBackgroundImage = () => {
    store.clearBackgroundImage()
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

        <button
          className="text-xs px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
          onClick={() => setShowSizeDialog(true)}
          title={t('setCanvasSize')}
        >
          <div>
            {store.canvasWidth} × {store.canvasHeight}
          </div>
        </button>

        <ToolbarButton
          onClick={handleSetBackgroundImage}
          title={t('setBackgroundImage')}
        >
          <Image size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleClearBackgroundImage}
          disabled={!store.backgroundImage}
          title={t('clearBackgroundImage')}
        >
          <ImageOff size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <div className="flex items-center gap-1.5 px-1">
          <ToolbarLabel>{`${t('canvasBackground')}:`}</ToolbarLabel>
          <ToolbarColor
            value={store.canvasBgColor}
            onChange={(e) => store.setCanvasBgColor(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <ToolbarLabel>{`${t('imageBackground')}:`}</ToolbarLabel>
          <ToolbarColor
            value={store.imageBgColor}
            onChange={(e) => store.setImageBgColor(e.target.value)}
          />
        </div>

        <ToolbarSpacer />

        <ToolbarButton
          onClick={handleCopy}
          className={className(copied && tw.primary.text)}
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
