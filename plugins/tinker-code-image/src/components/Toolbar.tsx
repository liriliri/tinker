import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Download, Moon, Sun, ListOrdered, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import Select from 'share/components/Select'
import store, { LANGUAGES, THEMES } from '../store'
import * as htmlToImage from 'html-to-image'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleExport = async () => {
    const frameElement = document.getElementById('code-frame')
    if (!frameElement) return

    try {
      const dataUrl = await htmlToImage.toPng(frameElement, {
        pixelRatio: 2,
      })

      // Create download link
      const link = document.createElement('a')
      link.download = 'code-image.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to export image:', error)
    }
  }

  const handleCopy = async () => {
    const frameElement = document.getElementById('code-frame')
    if (!frameElement) return

    try {
      const blob = await htmlToImage.toBlob(frameElement, {
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

  const languageOptions = Object.values(LANGUAGES).map((lang) => ({
    label: lang.name,
    value: lang.name,
  }))

  const themeOptions = Object.values(THEMES).map((theme) => ({
    label: t(`theme.${theme.id}`),
    value: theme.id,
  }))

  return (
    <Toolbar>
      <Select
        value={store.selectedLanguage.name}
        onChange={(value) => {
          const lang = Object.values(LANGUAGES).find((l) => l.name === value)
          if (lang) store.setLanguage(lang)
        }}
        options={languageOptions}
      />

      <ToolbarSeparator />

      <Select
        value={store.selectedTheme.id}
        onChange={(value) => {
          const theme = Object.values(THEMES).find((t) => t.id === value)
          if (theme) store.setTheme(theme)
        }}
        options={themeOptions}
      />

      <ToolbarButton
        onClick={() => store.toggleDarkMode()}
        title={store.darkMode ? t('lightMode') : t('darkMode')}
      >
        {store.darkMode ? (
          <Sun size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Moon size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarButton
        onClick={() => store.toggleLineNumbers()}
        title={t('lineNumbers')}
        variant="toggle"
        active={store.showLineNumbers}
      >
        <ListOrdered size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <ToolbarButton
        onClick={handleCopy}
        className={copied ? 'text-[#0fc25e]' : ''}
        title={t('copyImage')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <button
        onClick={handleExport}
        className="px-3 py-1 text-xs bg-[#0fc25e] hover:bg-[#0da84f] text-white font-medium rounded transition-colors flex items-center gap-1.5"
      >
        <Download size={TOOLBAR_ICON_SIZE} />
        {t('exportImage')}
      </button>
    </Toolbar>
  )
})
