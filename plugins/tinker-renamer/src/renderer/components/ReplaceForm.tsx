import { useTranslation } from 'react-i18next'
import TextInput from 'share/components/TextInput'
import Checkbox from 'share/components/Checkbox'
import type { ReplaceInfo } from '../../common/types'

interface ReplaceFormProps {
  info: ReplaceInfo
  onChange: (info: ReplaceInfo) => void
}

export default function ReplaceForm({ info, onChange }: ReplaceFormProps) {
  const { t } = useTranslation()

  const update = (patch: Partial<ReplaceInfo>) => {
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
      <div>
        <label className="text-xs font-medium block mb-1">
          {t('replaceWith')}
        </label>
        <TextInput
          value={info.replace}
          onChange={(e) => update({ replace: e.target.value })}
          placeholder={t('replaceWith')}
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
        <Checkbox
          checked={info.includeExt}
          onChange={(v) => update({ includeExt: v })}
        >
          {t('includeExt')}
        </Checkbox>
      </div>
    </div>
  )
}
