import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import {
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
} from 'share/components/StatusBar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Statusbar() {
  const { t } = useTranslation()
  const image = store.selectedImage

  return (
    <StatusBar>
      {store.queueCount > 0 && (
        <StatusBarItem clickable={false} className={tw.primary.text}>
          {t('queue')}: {store.queueCount}
        </StatusBarItem>
      )}
      {image ? (
        <>
          <StatusBarItem
            clickable
            className="min-w-0 max-w-[40%]"
            onClick={() => tinker.showItemInPath(image.path)}
          >
            <span className="truncate" title={image.prompt}>
              {image.prompt}
            </span>
          </StatusBarItem>
          <StatusBarItem clickable={false}>{image.size}</StatusBarItem>
          <StatusBarItem clickable={false}>
            {fileSize(image.bytes)}
          </StatusBarItem>
          <StatusBarItem clickable={false}>
            {image.provider}/{image.model}
          </StatusBarItem>
        </>
      ) : (
        <StatusBarItem clickable={false}>{t('noImage')}</StatusBarItem>
      )}
      <StatusBarSpacer />
      <StatusBarItem clickable={false}>
        {t('images')}: {store.images.length}
      </StatusBarItem>
    </StatusBar>
  )
})
