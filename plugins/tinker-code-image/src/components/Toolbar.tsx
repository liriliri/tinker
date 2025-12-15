import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Download, Moon, Sun } from 'lucide-react'
import {
  Toolbar as ToolbarContainer,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import Select from 'share/components/Select'
import store, { LANGUAGES } from '../store'
import * as htmlToImage from 'html-to-image'

const Toolbar = observer(() => {
  const { t } = useTranslation()

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

  const handleToggleDarkMode = () => {
    store.setDarkMode(!store.darkMode)
  }

  const languageOptions = Object.values(LANGUAGES).map((lang) => ({
    label: lang.name,
    value: lang.name,
  }))

  return (
    <ToolbarContainer>
      <Select
        value={store.selectedLanguage.name}
        onChange={(value) => {
          const lang = Object.values(LANGUAGES).find((l) => l.name === value)
          if (lang) store.setLanguage(lang)
        }}
        options={languageOptions}
      />

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleToggleDarkMode}
        title={store.darkMode ? t('lightMode') : t('darkMode')}
      >
        {store.darkMode ? (
          <Sun size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Moon size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarSpacer />

      <button
        onClick={handleExport}
        className="px-3 py-1 text-xs bg-[#0fc25e] hover:bg-[#0da84f] text-white font-medium rounded transition-colors flex items-center gap-1.5"
      >
        <Download size={TOOLBAR_ICON_SIZE} />
        {t('exportImage')}
      </button>
    </ToolbarContainer>
  )
})

export default Toolbar
