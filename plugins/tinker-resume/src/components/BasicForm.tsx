import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import { FieldRow } from './FormField'

export default observer(function BasicForm() {
  const { t } = useTranslation()
  const { basic } = store.resume

  return (
    <div className="flex items-stretch gap-2">
      <div className="relative w-52 shrink-0">
        <button
          type="button"
          className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-dashed ${tw.border} ${tw.bg.primary} ${tw.text.tertiary} ${tw.hover}`}
          onClick={() => store.pickPhoto()}
          title={t('choosePhoto')}
        >
          {basic.photo ? (
            <img
              src={basic.photo}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImagePlus size={22} />
          )}
        </button>
        {basic.photo ? (
          <button
            type="button"
            className={`absolute right-1.5 top-1.5 rounded-md p-1.5 ${tw.bg.primary} ${tw.text.secondary} ${tw.hover}`}
            onClick={() => store.clearPhoto()}
            title={t('removePhoto')}
          >
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>

      <div
        className={`min-w-0 flex-1 overflow-hidden rounded-xl border ${tw.border} ${tw.bg.primary}`}
      >
        <FieldRow
          label={t('name')}
          value={basic.name}
          onChange={(value) => store.updateBasic({ name: value })}
        />
        <FieldRow
          label={t('title')}
          value={basic.title}
          onChange={(value) => store.updateBasic({ title: value })}
        />
        <FieldRow
          label={t('email')}
          value={basic.email}
          onChange={(value) => store.updateBasic({ email: value })}
        />
        <FieldRow
          label={t('phone')}
          value={basic.phone}
          onChange={(value) => store.updateBasic({ phone: value })}
        />
        <FieldRow
          label={t('location')}
          value={basic.location}
          onChange={(value) => store.updateBasic({ location: value })}
        />
        <FieldRow
          label={t('birthDate')}
          value={basic.birthDate}
          onChange={(value) => store.updateBasic({ birthDate: value })}
        />
        <FieldRow
          label={t('employementStatus')}
          value={basic.employementStatus}
          onChange={(value) => store.updateBasic({ employementStatus: value })}
        />
        <FieldRow
          label={t('website')}
          value={basic.website}
          onChange={(value) => store.updateBasic({ website: value })}
        />
      </div>
    </div>
  )
})
