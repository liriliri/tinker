// Reference content for regex tokens with i18n support
import type { Token } from './ExpressionLexer'
import i18n from '../i18n'

function fillTags(str: string, token: Token): string {
  return str.replace(/{{(\w+)}}/g, (match, key) => {
    const value = (token as any)[key]
    if (value === undefined) return match
    if (key === 'code' && typeof value === 'number') {
      const chr = String.fromCharCode(value)
      // Show printable characters
      if (value >= 32 && value <= 126) {
        return chr
      }
      // Show special character names
      const specialChars: Record<number, string> = {
        9: 'TAB',
        10: 'LF',
        13: 'CR',
        32: 'SPACE',
      }
      return specialChars[value] || `\\x${value.toString(16).padStart(2, '0')}`
    }
    if (key === 'min' && token.max !== undefined) {
      const min = token.min || 0
      const max = token.max
      if (max === -1) {
        return i18n.t('minOrMore', { min })
      }
      if (min === max) {
        return i18n.t('times', { min })
      }
      return i18n.t('minToMax', { min, max })
    }
    return String(value)
  })
}

export function getTipForToken(token: Token | null): string | null {
  if (!token) return null

  const tokenKey = token.type || token.clss || ''
  const hasReference = i18n.exists(`reference.${tokenKey}.label`)

  if (!hasReference) return null

  let label = i18n.t(`reference.${tokenKey}.label`, {
    defaultValue: token.type,
  })
  let tip = i18n.t(`reference.${tokenKey}.tip`, {
    defaultValue: i18n.t(`reference.${tokenKey}.desc`, { defaultValue: '' }),
  })

  tip = fillTags(tip, token)

  if (token.error && !token.error.warning) {
    const errorLabel = i18n.t('errorLabel')
    const errorTip = i18n.t(`reference.${token.error.id}.tip`, {
      defaultValue: i18n.t(`reference.${token.error.id}.desc`, {
        defaultValue: i18n.t('unknownError'),
      }),
    })
    return `<span class="error">${errorLabel}:</span> ${errorTip}`
  }

  if (token.type === 'group' && token.num) {
    label += ` #${token.num}`
  }

  label = label[0].toUpperCase() + label.substr(1)

  if (token.error && token.error.warning) {
    const warningLabel = i18n.t('warningLabel')
    const warningTip = i18n.t(`reference.${token.error.id}.tip`, {
      defaultValue: i18n.t(`reference.${token.error.id}.desc`, {
        defaultValue: i18n.t('unknownWarning'),
      }),
    })
    tip += `<br/><span class="warning">${warningLabel}:</span> ${warningTip}`
  }

  return `<b>${label}.</b> ${tip}`
}
