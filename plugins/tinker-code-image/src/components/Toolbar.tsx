import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Save, Copy, Check, WandSparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import className from 'licia/className'
import find from 'licia/find'
import upperFirst from 'licia/upperFirst'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import Checkbox from 'share/components/Checkbox'
import DarkModeSwitch from 'share/components/DarkModeSwitch'
import Select from 'share/components/Select'
import { alert } from 'share/components/Alert'
import { tw } from 'share/theme'
import store from '../store'
import { LANGUAGES } from '../lib/languages'
import { THEMES } from '../lib/themes'
import { isFormattable, formatCode } from '../lib/formatter'
import { captureCodeImagePng } from '../lib/exportImage'

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
        label: t(`theme${upperFirst(theme.id)}`),
        value: theme.id,
      })),
    [t]
  )

  const handleSave = async () => {
    try {
      const blob = await captureCodeImagePng()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'code-image.png'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to save image:', error)
    }
  }

  const handleCopy = async () => {
    try {
      const blob = await captureCodeImagePng()
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy image:', error)
    }
  }

  const formattable = isFormattable(store.languageKey)

  const handleFormat = async () => {
    const lang = store.languageKey
    if (!isFormattable(lang)) return
    try {
      const result = await formatCode(store.code, lang)
      store.setCode(result)
    } catch (error) {
      await alert({
        title: t('formatError'),
        message: (error as Error).message,
      })
    }
  }

  return (
    <Toolbar>
      <Select
        value={store.selectedLanguage.name}
        onChange={(value) => {
          const lang = find(Object.values(LANGUAGES), (l) => l.name === value)
          if (lang) store.setLanguage(lang)
        }}
        options={languageOptions}
      />

      <ToolbarSeparator />

      <Select
        value={store.selectedTheme.id}
        onChange={(value) => {
          const theme = find(Object.values(THEMES), (t) => t.id === value)
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

      <DarkModeSwitch
        dark={store.darkMode}
        onToggle={() => store.toggleDarkMode()}
        title={store.darkMode ? t('darkMode') : t('lightMode')}
        className="ml-3"
      />

      <ToolbarSpacer />

      <ToolbarButton
        onClick={handleFormat}
        disabled={!formattable}
        title={t('format')}
      >
        <WandSparkles size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

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
