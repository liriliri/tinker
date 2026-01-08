import { observer } from 'mobx-react-lite'
import { Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
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
  const { copied, copyToClipboard } = useCopyToClipboard()
  const [localValue, setLocalValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(cssValue)
  }

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
      <span
        className={`${tw.text.light.primary} ${tw.text.dark.secondary} font-medium w-24 text-sm`}
      >
        {label}
      </span>
      <input
        type="text"
        value={isEditing ? localValue : value}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={`flex-1 px-4 py-2.5 border ${tw.border.both} rounded-lg ${tw.bg.light.input} ${tw.bg.dark.input} ${tw.text.light.primary} ${tw.text.dark.primary} font-mono text-sm focus:outline-none focus:ring-2 ${tw.primary.focusRing}`}
      />
      <button
        onClick={handleCopy}
        className={`w-10 h-10 flex items-center justify-center ${
          copied
            ? tw.primary.text
            : `${tw.text.light.tertiary} ${tw.text.dark.tertiary}`
        } rounded-lg transition-colors`}
        title={copyTitle}
      >
        {copied ? <Check size={20} /> : <Copy size={20} />}
      </button>
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
