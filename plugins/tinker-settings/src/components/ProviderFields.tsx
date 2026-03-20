import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import type { AiProvider } from '../types'

interface Props {
  value: AiProvider
  onChange: (patch: Partial<AiProvider>) => void
}

export default function ProviderFields({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [showApiKey, setShowApiKey] = useState(false)

  const isClaude = value.apiType === 'claude'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('apiUrl')}
        </label>
        <TextInput
          value={value.apiUrl}
          onChange={(e) => onChange({ apiUrl: e.target.value })}
          placeholder={
            isClaude ? 'https://api.anthropic.com' : 'https://api.openai.com/v1'
          }
        />
        <p className={`text-xs ${tw.text.tertiary}`}>
          {isClaude ? t('claudeApiUrlHint') : t('apiUrlHint')}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('apiKey')}
        </label>
        <div className="relative">
          <TextInput
            type={showApiKey ? 'text' : 'password'}
            value={value.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder={t('apiKey')}
            className="pr-8"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary} hover:text-gray-600 dark:hover:text-gray-300`}
            title={showApiKey ? t('hideApiKey') : t('showApiKey')}
          >
            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('model')}
        </label>
        <TextInput
          value={value.model}
          onChange={(e) => onChange({ model: e.target.value })}
          placeholder={isClaude ? 'claude-opus-4-5' : 'gpt-4o'}
        />
      </div>
    </div>
  )
}
