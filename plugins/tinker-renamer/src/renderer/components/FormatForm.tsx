import { useTranslation } from 'react-i18next'
import Select from 'share/components/Select'
import type { FormatInfo, FormatType } from '../../common/types'

interface FormatFormProps {
  info: FormatInfo
  onChange: (info: FormatInfo) => void
}

export default function FormatForm({ info, onChange }: FormatFormProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium block mb-1">
          {t('formatType')}
        </label>
        <Select
          value={info.formatType}
          onChange={(v) => onChange({ formatType: v as FormatType })}
          options={[
            { label: t('upper'), value: 'upper' },
            { label: t('lower'), value: 'lower' },
            { label: t('capitalize'), value: 'capitalize' },
            { label: t('kebabCase'), value: 'kebabCase' },
            { label: t('snakeCase'), value: 'snakeCase' },
            { label: t('camelCase'), value: 'camelCase' },
            { label: t('upperFirst'), value: 'upperFirst' },
          ]}
          className="w-full"
        />
      </div>
    </div>
  )
}
