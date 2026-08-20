import contain from 'licia/contain'
import filter from 'licia/filter'
import find from 'licia/find'
import findIdx from 'licia/findIdx'
import isArr from 'licia/isArr'
import isStr from 'licia/isStr'
import map from 'licia/map'
import trim from 'licia/trim'
import { visibleItems } from './util'
import type { MenuSection, ResumeData } from '../types'

export const BUILTIN_CONTENT_IDS = [
  'skills',
  'experience',
  'projects',
  'education',
  'selfEvaluation',
  'certificates',
] as const

const SECTION_IDS = ['basic', ...BUILTIN_CONTENT_IDS]

function defaultMenuSections(): MenuSection[] {
  return [
    { id: 'basic', enabled: true },
    { id: 'skills', enabled: true },
    { id: 'experience', enabled: true },
    { id: 'projects', enabled: true },
    { id: 'education', enabled: true },
    { id: 'selfEvaluation', enabled: true },
    { id: 'certificates', enabled: true },
  ]
}

export function contentSections(resume: ResumeData) {
  return filter(
    resume.menuSections,
    (section) => section.id !== 'basic' && section.enabled
  )
}

export function hasSection(resume: ResumeData, id: string) {
  return Boolean(find(resume.menuSections, (section) => section.id === id))
}

export function sectionHasContent(resume: ResumeData, id: string) {
  if (id === 'skills') return Boolean(trim(resume.skillContent))
  if (id === 'experience') return visibleItems(resume.experience).length > 0
  if (id === 'projects') return visibleItems(resume.projects).length > 0
  if (id === 'education') return visibleItems(resume.education).length > 0
  if (id === 'selfEvaluation')
    return Boolean(trim(resume.selfEvaluationContent))
  if (id === 'certificates') return visibleItems(resume.certificates).length > 0
  return false
}

export function normalizeResume(data: ResumeData): ResumeData {
  const isLegacy = !isStr(data.selfEvaluationContent)
  const raw =
    isArr(data.menuSections) && data.menuSections.length > 0
      ? data.menuSections
      : defaultMenuSections()
  let menuSections = filter(raw, (section) => contain(SECTION_IDS, section.id))
  if (isLegacy) {
    const extras = filter(
      ['selfEvaluation', 'certificates'],
      (id) => !find(menuSections, (section) => section.id === id)
    )
    menuSections = [
      ...menuSections,
      ...map(extras, (id) => ({ id, enabled: true })),
    ]
  }
  return {
    ...data,
    selfEvaluationContent: isStr(data.selfEvaluationContent)
      ? data.selfEvaluationContent
      : '',
    certificates: isArr(data.certificates) ? data.certificates : [],
    menuSections:
      menuSections.length > 0 ? menuSections : defaultMenuSections(),
  }
}

export function reorderSections(
  sections: MenuSection[],
  fromId: string,
  toId: string
) {
  if (fromId === 'basic' || toId === 'basic' || fromId === toId) return sections
  const from = findIdx(sections, (section) => section.id === fromId)
  const to = findIdx(sections, (section) => section.id === toId)
  if (from < 1 || to < 1) return sections
  const next = sections.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
