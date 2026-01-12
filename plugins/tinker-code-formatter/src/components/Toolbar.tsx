import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import CopyButton from 'share/components/CopyButton'
import { alert } from 'share/components/Alert'
import { Clipboard, Eraser } from 'lucide-react'
import Select from 'share/components/Select'
import { tw } from 'share/theme'
import store from '../store'
import formatter from '../lib/formatter'
import { LANGUAGES } from '../lib/languages'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

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

      <CopyButton
        variant="toolbar"
        text={store.input}
        disabled={isEmpty}
        title={t('copy')}
      />

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
