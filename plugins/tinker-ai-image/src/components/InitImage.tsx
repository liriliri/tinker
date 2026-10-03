import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'
import ImageSlot from './ImageSlot'

export default observer(function InitImage() {
  const { t } = useTranslation()

  return (
    <ImageSlot
      path={store.initImagePath}
      alt={t('initImage')}
      emptyHint={t('dropImageHint')}
      clearTitle={t('clear')}
      onChoose={() => void store.chooseInitImage()}
      onClear={() => store.clearInitImage()}
      onSetPath={(path) => void store.setInitImagePath(path)}
    />
  )
})
