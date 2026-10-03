import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import TabBar from 'share/components/TabBar'
import { tw } from 'share/theme'
import store from '../store'
import ImageSlot from './ImageSlot'

export default observer(function ReferenceImages() {
  const { t } = useTranslation()
  const selected = store.selectedReferenceImage
  const path = selected?.path || ''
  const selectedIndex = store.referenceImages.findIndex(
    (item) => item.id === store.activeReferenceId
  )

  return (
    <div className={`-mx-3 border-t ${tw.border}`}>
      <TabBar
        tabs={store.referenceImages}
        activeTabId={store.activeReferenceId}
        onAddTab={
          store.canAddReferenceImage
            ? () => store.addReferenceImage()
            : undefined
        }
        onClose={(id) => store.closeReferenceImage(id)}
        onActivate={(id) => store.selectReferenceImage(id)}
        onMove={(from, to) => store.moveReferenceImage(from, to)}
        getTitle={(tab) => {
          const index = store.referenceImages.findIndex(
            (item) => item.id === tab.id
          )
          return `${t('referenceImage')} ${index + 1}`
        }}
        hideFirstBorder
      />
      <div className="px-3 pt-2">
        <ImageSlot
          path={path}
          alt={`${t('referenceImage')} ${selectedIndex + 1}`}
          emptyHint={t('dropImageHint')}
          clearTitle={t('clear')}
          onChoose={() => void store.chooseReferenceImage()}
          onClear={() => store.clearReferenceImage()}
          onSetPath={(nextPath) =>
            store.setReferenceImagePath(store.activeReferenceId, nextPath)
          }
        />
      </div>
    </div>
  )
})
