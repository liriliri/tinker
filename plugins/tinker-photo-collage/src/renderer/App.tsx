import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import { Shuffle, Save, X, Copy, Check } from 'lucide-react'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import * as htmlToImage from 'html-to-image'
import store from './store'
import TemplateSelector from './components/TemplateSelector'
import CollageCanvas from './components/CollageCanvas'
import SettingsPanel from './components/SettingsPanel'
import CanvasSizeDialog from './components/CanvasSizeDialog'
import { getTemplateById } from './lib/templates'

export default observer(function App() {
  const { t, i18n } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [showSizeDialog, setShowSizeDialog] = useState(false)

  useEffect(() => {
    const template = getTemplateById(store.selectedTemplateId)
    if (template) {
      store.setTemplate(template.id, template.areas)
    }
  }, [])

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
    <AlertProvider locale={i18n.language}>
      <div className={`h-screen flex flex-col ${tw.bg.both.secondary}`}>
        <Toolbar>
          <ToolbarButton onClick={() => {}} title={t('randomLayout')}>
            <Shuffle size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
          <ToolbarButton onClick={() => store.clearAll()} title={t('clearAll')}>
            <X size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>

          <ToolbarSeparator />

          <div className="flex items-center gap-1.5 px-1">
            <label className={`text-xs ${tw.text.both.secondary} whitespace-nowrap`}>
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
            <label className={`text-xs ${tw.text.both.secondary} whitespace-nowrap`}>
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

        <div className="flex-1 flex overflow-hidden">
          <TemplateSelector />
          <CollageCanvas />
          <SettingsPanel />
        </div>

        <CanvasSizeDialog
          open={showSizeDialog}
          onClose={() => setShowSizeDialog(false)}
          onConfirm={handleSetCanvasSize}
          currentWidth={store.canvasWidth}
          currentHeight={store.canvasHeight}
        />
      </div>
    </AlertProvider>
  )
})
