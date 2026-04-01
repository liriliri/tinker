import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import type { TemplateInfo } from '../../common/types'

interface TemplateFormProps {
  info: TemplateInfo
  onChange: (info: TemplateInfo) => void
}

export default function TemplateForm({ info, onChange }: TemplateFormProps) {
  const { t } = useTranslation()

  const update = (patch: Partial<TemplateInfo>) => {
    onChange({ ...info, ...patch })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium block mb-1">
          {t('templateContent')}
        </label>
        <TextInput
          value={info.template}
          onChange={(e) => update({ template: e.target.value })}
          placeholder="${name}${ext}"
          className="text-xs py-1.5"
        />
      </div>
      <p className="text-xs opacity-60">{t('templateHelp')}</p>
    </div>
  )
}
