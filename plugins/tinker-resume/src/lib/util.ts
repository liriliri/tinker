import compact from 'licia/compact'
import contain from 'licia/contain'
import escape from 'licia/escape'
import filter from 'licia/filter'
import isArr from 'licia/isArr'
import isObj from 'licia/isObj'
import isStr from 'licia/isStr'
import map from 'licia/map'
import some from 'licia/some'
import startWith from 'licia/startWith'
import trim from 'licia/trim'
import { openImageFile } from 'share/lib/util'
import type { ResumeBasic, ResumeData, TemplateId } from '../types'

export const DEFAULT_THEME_COLOR = '#1e293b'

export function isThemeColor(value: unknown): value is string {
  return isStr(value) && startWith(value, '#') && value.length === 7
}

const TEMPLATE_IDS: TemplateId[] = ['classic', 'sidebar']

export function isTemplateId(value: unknown): value is TemplateId {
  return isStr(value) && contain(TEMPLATE_IDS, value)
}

export function isResumeData(value: unknown): value is ResumeData {
  if (!isObj(value)) return false
  const data = value as ResumeData
  return (
    isObj(data.basic) &&
    isStr(data.basic.name) &&
    isStr(data.skillContent) &&
    isArr(data.experience) &&
    isArr(data.projects) &&
    isArr(data.education)
  )
}

export function patchItem<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>
) {
  return map(items, (item) => (item.id === id ? { ...item, ...patch } : item))
}

export function omitItem<T extends { id: string }>(items: T[], id: string) {
  return filter(items, (item) => item.id !== id)
}

export function visibleItems<T extends { visible: boolean }>(items: T[]) {
  return filter(items, (item) => item.visible)
}

export function contactLines(basic: ResumeBasic) {
  return compact([
    basic.email,
    basic.phone,
    basic.location,
    basic.birthDate,
    basic.employementStatus,
    basic.website,
  ])
}

function isBulletLine(line: string) {
  return startWith(line, '-') || startWith(line, '•') || startWith(line, '*')
}

function stripBullet(line: string) {
  return trim(line.replace(/^[-•*]\s*/, ''))
}

export function textToHtml(text: string) {
  const value = trim(text)
  if (!value) return ''
  if (contain(value, '<')) return value

  const lines = compact(map(value.split('\n'), (line) => trim(line)))
  if (lines.length > 1 && !some(lines, (line) => !isBulletLine(line))) {
    const items = map(
      lines,
      (line) => `<li>${escape(stripBullet(line))}</li>`
    ).join('')
    return `<ul>${items}</ul>`
  }

  return map(lines, (line) => escape(line)).join('<br/>')
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function pickPhotoDataUrl() {
  const result = await openImageFile()
  if (!result) return null
  return fileToDataUrl(result.file)
}
