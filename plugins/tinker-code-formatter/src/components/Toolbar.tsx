import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { alert } from 'share/components/Alert'
import { Copy, Clipboard, Eraser, Check } from 'lucide-react'
import Select from 'share/components/Select'
import store from '../store'
import formatter from '../lib/formatter'
import { LANGUAGES } from '../lib/languages'
import { tw } from 'share/theme'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

  const languageOptions = Object.values(LANGUAGES).map((lang) => ({
    value: lang.id,
    label: lang.name,
  }))

  const tabOptions = [
    { value: 0, label: t('tabNone') },
    { value: 2, label: t('tab2') },
    { value: 4, label: t('tab4') },
    { value: 6, label: t('tab6') },
    { value: 8, label: t('tab8') },
  ]

  const handleFormat = async () => {
    if (!store.input.trim()) {
      await alert({ title: t('emptyInput') })
      return
    }

    try {
      const handle = await formatter.load(store.language)
      const result = await handle
        .set(store.input, { tab: store.tabWidth })
        .format()

      if (result) {
        store.setInput(result)
      }
    } catch (error) {
      await alert({
        title: t('formatError'),
        message: (error as Error).message,
      })
    }
  }

  const handleCopy = async () => {
    await copyToClipboard(store.input)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      store.setInput(text)
    } catch {
      await alert({ title: t('pasteError') })
    }
  }

  const handleClear = () => {
    store.setInput('')
  }

  const isEmpty = !store.input.trim()

  return (
    <Toolbar>
      <Select
        value={store.language}
        onChange={(val) => store.setLanguage(val)}
        options={languageOptions}
      />
      <Select
        value={store.tabWidth}
        onChange={(val) => store.setTabWidth(val as number)}
        options={tabOptions}
      />

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleCopy}
        disabled={isEmpty}
        className={copied ? tw.primary.text : ''}
        title={t('copy')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

      <ToolbarButton onClick={handlePaste} title={t('paste')}>
        <Clipboard size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleClear}
        disabled={isEmpty}
        title={t('clear')}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <button
        onClick={handleFormat}
        disabled={isEmpty}
        className={`px-3 py-1 rounded text-sm ${tw.primary.bg} ${tw.primary.bgHover} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {t('format')}
      </button>
    </Toolbar>
  )
})
