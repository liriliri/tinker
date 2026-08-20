import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { FieldArea } from './FormField'

export default observer(function SkillForm() {
  const { t } = useTranslation()

  return (
    <FieldArea
      value={store.resume.skillContent}
      onChange={(value) => store.setSkillContent(value)}
      placeholder={t('skillPlaceholder')}
      rows={12}
    />
  )
})
