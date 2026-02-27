import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Save, Moon, Sun, Copy, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import className from 'licia/className'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import Checkbox from 'share/components/Checkbox'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import store, { LANGUAGES, THEMES } from '../store'
import * as htmlToImage from 'html-to-image'

const languageOptions = Object.values(LANGUAGES).map((lang) => ({
  label: lang.name,
  value: lang.name,
}))

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const themeOptions = useMemo(
    () =>
      Object.values(THEMES).map((theme) => ({
        label: t(`theme.${theme.id}`),
        value: theme.id,
      })),
    [t]
  )

  const getFrameElement = () => {
    const frameElement = document.getElementById('code-frame')
    if (!frameElement) {
      console.error('Frame element not found')
    }
    return frameElement
  }

  const handleSave = async () => {
    const frameElement = getFrameElement()
    if (!frameElement) return

    try {
      const dataUrl = await htmlToImage.toPng(frameElement, {
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = 'code-image.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to save image:', error)
    }
  }

  const handleCopy = async () => {
    const frameElement = getFrameElement()
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

      <Checkbox
        checked={store.showLineNumbers}
        onChange={(checked) => store.setShowLineNumbers(checked)}
        className="ml-3"
      >
        {t('lineNumbers')}
      </Checkbox>

      <button
        onClick={() => store.toggleDarkMode()}
        title={store.darkMode ? t('darkMode') : t('lightMode')}
        className={className(
          'ml-3 relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out',
          {
            'bg-gray-700 dark:bg-gray-600': store.darkMode,
            'bg-gray-300': !store.darkMode,
          }
        )}
      >
        <div
          className={className(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ease-in-out',
            {
              'translate-x-5': store.darkMode,
              'translate-x-0': !store.darkMode,
            }
          )}
        >
          {store.darkMode ? (
            <Moon size={10} className="text-gray-700" />
          ) : (
            <Sun size={10} className="text-amber-500" />
          )}
        </div>
      </button>

      <ToolbarSpacer />

      <ToolbarButton
        onClick={handleCopy}
        className={className({ [tw.primary.text]: copied })}
        title={t('copyImage')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarButton onClick={handleSave} title={t('saveImage')}>
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
