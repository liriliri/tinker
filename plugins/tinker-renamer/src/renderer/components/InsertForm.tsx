import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import Select from 'share/components/Select'
import type { InsertInfo, InsertPosition } from '../../common/types'

interface InsertFormProps {
  info: InsertInfo
  onChange: (info: InsertInfo) => void
}

export default function InsertForm({ info, onChange }: InsertFormProps) {
  const { t } = useTranslation()

  const update = (patch: Partial<InsertInfo>) => {
    onChange({ ...info, ...patch })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium block mb-1">{t('content')}</label>
        <TextInput
          value={info.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder={t('content')}
          className="text-xs py-1.5"
        />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">
          {t('position')}
        </label>
        <Select
          value={info.position}
          onChange={(v) => update({ position: v as InsertPosition })}
          options={[
            { label: t('prefix'), value: 'prefix' },
            { label: t('suffix'), value: 'suffix' },
          ]}
          className="w-full"
        />
      </div>
    </div>
  )
}
