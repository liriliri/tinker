import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Camera, FolderOpen, PictureInPicture2 } from 'lucide-react'
import {
  Toolbar as SharedToolbar,
  ToolbarButton,
  ToolbarTextButton,
  ToolbarSeparator,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import store from '../store'
import { launchFloatWindow } from '../lib/floatWindow'
import SizeDialog from './SizeDialog'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleSizeConfirm = (width: number, height: number) => {
    store.setWindowWidth(width)
    store.setWindowHeight(height)
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && urlInput.trim()) {
      store.setUrlSrc(urlInput.trim())
    }
  }

  return (
    <SharedToolbar>
      <ToolbarButton
        title={t('captureScreen')}
        onClick={() => store.captureScreen()}
      >
        <Camera size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton title={t('openFile')} onClick={() => store.openFile()}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarTextInput
        className="flex-1 min-w-0"
        placeholder={t('inputPlaceholder')}
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={handleUrlKeyDown}
      />

      <button
        className={`text-xs px-2 py-1 ${tw.hover} rounded transition-colors cursor-pointer`}
        onClick={() => setShowSizeDialog(true)}
        title={t('floatSettings')}
      >
        {store.windowWidth} x{' '}
        {store.contentType === 'image'
          ? store.effectiveHeight
          : store.windowHeight}
      </button>

      <ToolbarSeparator />

      <Checkbox
        checked={store.alwaysOnTop}
        onChange={(v) => store.setAlwaysOnTop(v)}
      >
        {t('alwaysOnTop')}
      </Checkbox>

      <ToolbarSeparator />

      <ToolbarTextButton
        disabled={!store.canFloat}
        onClick={() => {
          launchFloatWindow()
          setUrlInput('')
        }}
        className="flex items-center gap-1"
        title={t('floatTip')}
      >
        <PictureInPicture2 size={TOOLBAR_ICON_SIZE} />
        {t('float')}
      </ToolbarTextButton>

      <SizeDialog
        open={showSizeDialog}
        onClose={() => setShowSizeDialog(false)}
        onConfirm={handleSizeConfirm}
        currentWidth={store.windowWidth}
        currentHeight={
          store.contentType === 'image'
            ? store.effectiveHeight
            : store.windowHeight
        }
        heightDisabled={store.contentType === 'image'}
      />
    </SharedToolbar>
  )
})
