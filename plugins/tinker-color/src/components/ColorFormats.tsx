import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import CopyButton from 'share/components/CopyButton'
import TextInput from 'share/components/TextInput'
import { tw } from 'share/theme'
import store from '../store'
import {
  hexToRgb,
  rgbToHsl,
  rgbToHsv,
  rgbToCmyk,
  rgbToLab,
  rgbToHsi,
  formatHex,
  formatRgb,
  formatHsl,
  formatHsv,
  formatCmyk,
  formatLab,
  formatHsi,
  parseColorToHex,
  toCssHex,
  toCssRgb,
  toCssHsl,
  toCssHsv,
  toCssCmyk,
  toCssLab,
  toCssHsi,
} from '../lib/util'

interface FormatRowProps {
  label: string
  value: string
  copyTitle: string
  format: 'hex' | 'rgb' | 'hsl' | 'hsv' | 'cmyk' | 'lab' | 'hsi'
  cssValue: string
}

function FormatRow({
  label,
  value,
  copyTitle,
  format,
  cssValue,
}: FormatRowProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Try to parse and apply immediately if valid
    const hex = parseColorToHex(newValue, format)
    if (hex) {
      store.setColor(hex)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    // Reset to current formatted value when blur
    setLocalValue(value)
  }

  const handleFocus = () => {
    setIsEditing(true)
    setLocalValue(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className={`${tw.text.both.primary} font-medium w-24 text-sm`}>
        {label}
      </span>
      <div className="relative flex-1">
        <TextInput
          type="text"
          value={isEditing ? localValue : value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={`w-full px-4 py-2.5 pr-10 rounded-lg font-mono text-sm focus:ring-2 ${tw.bg.both.input} ${tw.text.both.primary} ${tw.primary.focusRing}`}
        />
        <CopyButton
          text={cssValue}
          title={copyTitle}
          variant="icon"
          iconClassName={tw.text.both.primary}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded ${tw.hover.both}`}
        />
      </div>
    </div>
  )
}

export default observer(function ColorFormats() {
  const { t } = useTranslation()
  const rgb = hexToRgb(store.currentColor)
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b)
  const hsi = rgbToHsi(rgb.r, rgb.g, rgb.b)

  return (
    <div className="flex flex-col gap-6">
      {/* Color Preview */}
      <div
        className="w-full h-20 rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: store.currentColor }}
      ></div>

      {/* Color Formats */}
      <div className="flex flex-col gap-3">
        <FormatRow
          label="HEX"
          value={formatHex(store.currentColor)}
          copyTitle={t('copyToClipboard')}
          format="hex"
          cssValue={toCssHex(store.currentColor)}
        />
        <FormatRow
          label="RGB"
          value={formatRgb(rgb)}
          copyTitle={t('copyToClipboard')}
          format="rgb"
          cssValue={toCssRgb(rgb)}
        />
        <FormatRow
          label="HSV/HSB"
          value={formatHsv(hsv)}
          copyTitle={t('copyToClipboard')}
          format="hsv"
          cssValue={toCssHsv(hsv)}
        />
        <FormatRow
          label="HSL"
          value={formatHsl(hsl)}
          copyTitle={t('copyToClipboard')}
          format="hsl"
          cssValue={toCssHsl(hsl)}
        />
        <FormatRow
          label="CMYK"
          value={formatCmyk(cmyk)}
          copyTitle={t('copyToClipboard')}
          format="cmyk"
          cssValue={toCssCmyk(cmyk)}
        />
        <FormatRow
          label="HSI"
          value={formatHsi(hsi)}
          copyTitle={t('copyToClipboard')}
          format="hsi"
          cssValue={toCssHsi(hsi)}
        />
        <FormatRow
          label="CIE-LAB"
          value={formatLab(lab)}
          copyTitle={t('copyToClipboard')}
          format="lab"
          cssValue={toCssLab(lab)}
        />
      </div>
    </div>
  )
})
