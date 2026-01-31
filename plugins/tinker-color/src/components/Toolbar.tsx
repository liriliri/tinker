import { observer } from 'mobx-react-lite'
import { Pipette, Clipboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Color from 'color'
import {
  Toolbar,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import store from '../store'
import i18n from '../i18n'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const handleEyeDropper = async () => {
    if (!('EyeDropper' in window)) {
      console.warn('EyeDropper API is not supported in this browser')
      return
    }

    try {
      // @ts-ignore - EyeDropper API is not yet in TypeScript types
      const eyeDropper = new EyeDropper()
      const result = await eyeDropper.open()
      if (result.sRGBHex) {
        store.setColor(result.sRGBHex)
      }
    } catch {
      // User cancelled the eyedropper
      console.log('EyeDropper cancelled')
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const trimmedText = text.trim()

      // Try to parse the color using the color library
      const color = Color(trimmedText)
      const hexColor = color.hex()
      store.setColor(hexColor)
      toast.success(i18n.t('pasteSuccess'))
    } catch (err) {
      toast.error(i18n.t('pasteFailed'))
      console.error('Failed to parse color:', err)
    }
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleEyeDropper} title={t('pickColor')}>
        <Pipette size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={handlePaste} title={t('pasteColor')}>
        <Clipboard size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />
    </Toolbar>
  )
})
