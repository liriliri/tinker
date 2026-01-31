import { observer } from 'mobx-react-lite'
import { ArrowLeftRight, GitCompare, PenLine, Eraser } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import store from '../store'
import { SUPPORTED_LANGUAGES } from '../lib/languageDetector'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const isDiffMode = store.mode === 'diff'

  const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({
    label: lang.label,
    value: lang.id,
  }))

  return (
    <Toolbar className="justify-between">
      <div className="flex gap-1 items-center">
        <ToolbarButton
          variant="toggle"
          active={store.mode === 'edit'}
          onClick={() => store.setMode('edit')}
          title={t('editMode')}
        >
          <PenLine size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          variant="toggle"
          active={store.mode === 'diff'}
          onClick={() => store.setMode('diff')}
          title={t('diffMode')}
        >
          <GitCompare size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <Select
          value={store.language}
          onChange={(value) => store.setLanguage(value)}
          options={languageOptions}
          title={t('selectLanguage')}
        />

        <ToolbarButton
          onClick={() => store.swapTexts()}
          disabled={isDiffMode || store.isEmpty}
          title={t('swap')}
        >
          <ArrowLeftRight size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => store.clearText()}
          disabled={isDiffMode || store.isEmpty}
          title={t('clear')}
        >
          <Eraser size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </div>

      {isDiffMode && (
        <div className="flex gap-3 text-xs mr-1">
          <span className="text-green-600 dark:text-green-400">
            +{store.diffStats.additions}
          </span>
          <span className="text-red-600 dark:text-red-400">
            -{store.diffStats.deletions}
          </span>
        </div>
      )}
    </Toolbar>
  )
})
