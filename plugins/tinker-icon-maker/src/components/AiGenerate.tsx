import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import className from 'licia/className'
import { Loader2 } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import SwitchRow from './SwitchRow'

const AiGenerate = observer(function AiGenerate() {
  const { t } = useTranslation()

  if (!store.hasAiImageProvider) return null

  return (
    <div className="space-y-2">
      <textarea
        className={className(
          'h-20 w-full resize-none rounded border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1',
          tw.border,
          tw.bg.input,
          tw.text.primary,
          tw.primary.focusBorder,
          tw.primary.focusRing
        )}
        value={store.aiPrompt}
        placeholder={t('aiPromptPlaceholder')}
        disabled={store.isAiGenerating}
        onChange={(e) => store.setAiPrompt(e.target.value)}
      />
      <SwitchRow
        label={t('aiTransparentBg')}
        checked={store.aiTransparentBg}
        disabled={store.isAiGenerating}
        onChange={(checked) => store.setAiTransparentBg(checked)}
      />
      <button
        type="button"
        className={className(
          'flex h-8 w-full items-center justify-center rounded px-3 text-sm leading-none text-white disabled:cursor-not-allowed disabled:opacity-50',
          tw.primary.bg,
          tw.primary.bgHover
        )}
        disabled={!store.canGenerateAi}
        onClick={() => void store.generateAiIcon()}
      >
        {store.isAiGenerating ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          t('aiGenerate')
        )}
      </button>
    </div>
  )
})

export default AiGenerate
