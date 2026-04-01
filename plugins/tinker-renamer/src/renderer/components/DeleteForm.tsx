import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import Checkbox from 'share/components/Checkbox'
import type { DeleteInfo } from '../../common/types'

interface DeleteFormProps {
  info: DeleteInfo
  onChange: (info: DeleteInfo) => void
}

export default function DeleteForm({ info, onChange }: DeleteFormProps) {
  const { t } = useTranslation()

  const update = (patch: Partial<DeleteInfo>) => {
    onChange({ ...info, ...patch })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium block mb-1">{t('match')}</label>
        <TextInput
          value={info.match}
          onChange={(e) => update({ match: e.target.value })}
          placeholder={t('match')}
          className="text-xs py-1.5"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Checkbox
          checked={info.useRegExp}
          onChange={(v) => update({ useRegExp: v })}
        >
          {t('useRegExp')}
        </Checkbox>
        <Checkbox
          checked={info.caseSensitive}
          onChange={(v) => update({ caseSensitive: v })}
        >
          {t('caseSensitive')}
        </Checkbox>
        <Checkbox
          checked={info.matchAll}
          onChange={(v) => update({ matchAll: v })}
        >
          {t('matchAll')}
        </Checkbox>
      </div>
    </div>
  )
}
