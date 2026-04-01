import escapeRegExp from 'licia/escapeRegExp'
import capitalize from 'licia/capitalize'
import camelCase from 'licia/camelCase'
import kebabCase from 'licia/kebabCase'
import snakeCase from 'licia/snakeCase'
import upperCase from 'licia/upperCase'
import lowerCase from 'licia/lowerCase'
import upperFirst from 'licia/upperFirst'
import type {
  Rule,
  ReplaceInfo,
  InsertInfo,
  DeleteInfo,
  FormatInfo,
  FormatType,
  TemplateInfo,
} from '../../common/types'
import { parseFile } from './util'

function applyFormat(str: string, formatType: FormatType): string {
  switch (formatType) {
    case 'upper':
      return upperCase(str)
    case 'lower':
      return lowerCase(str)
    case 'capitalize':
      return capitalize(str)
    case 'kebabCase':
      return kebabCase(str)
    case 'snakeCase':
      return snakeCase(str)
    case 'camelCase':
      return camelCase(str)
    case 'upperFirst':
      return upperFirst(str)
    default:
      return str
  }
}

function buildRegex(
  pattern: string,
  useRegExp: boolean,
  caseSensitive: boolean,
  matchAll: boolean
): RegExp | null {
  try {
    const source = useRegExp ? pattern : escapeRegExp(pattern)
    const flags = (matchAll ? 'g' : '') + (caseSensitive ? '' : 'i')
    return new RegExp(source, flags)
  } catch {
    return null
  }
}

function execReplace(info: ReplaceInfo, name: string, ext: string): string {
  if (!info.match) return name + ext

  const target = info.includeExt ? name + ext : name
  const regex = buildRegex(
    info.match,
    info.useRegExp,
    info.caseSensitive,
    info.matchAll
  )
  if (!regex) return name + ext

  const result = target.replace(regex, info.replace)
  return info.includeExt ? result : result + ext
}

function execInsert(info: InsertInfo, name: string, ext: string): string {
  if (!info.content) return name + ext

  if (info.position === 'prefix') {
    return info.content + name + ext
  }
  return name + info.content + ext
}

function execDelete(info: DeleteInfo, name: string, ext: string): string {
  if (!info.match) return name + ext

  const regex = buildRegex(
    info.match,
    info.useRegExp,
    info.caseSensitive,
    info.matchAll
  )
  if (!regex) return name + ext

  return name.replace(regex, '') + ext
}

function execFormat(info: FormatInfo, name: string, ext: string): string {
  return applyFormat(name, info.formatType) + ext
}

function execTemplate(
  info: TemplateInfo,
  name: string,
  ext: string,
  index: number
): string {
  if (!info.template) return name + ext

  try {
    const fullName = name + ext
    const fn = new Function(
      'name',
      'fullName',
      'ext',
      'index',
      'return `' + info.template + '`'
    )
    const result = fn(name, fullName, ext, index) as string
    return result
  } catch {
    return name + ext
  }
}

function splitNameAndExt(fullName: string): { name: string; ext: string } {
  const { name, ext } = parseFile(fullName)

  return { name, ext }
}

export function execRule(
  rule: Rule,
  name: string,
  ext: string,
  index: number
): string {
  switch (rule.type) {
    case 'replace':
      return execReplace(rule.info as ReplaceInfo, name, ext)
    case 'insert':
      return execInsert(rule.info as InsertInfo, name, ext)
    case 'delete':
      return execDelete(rule.info as DeleteInfo, name, ext)
    case 'format':
      return execFormat(rule.info as FormatInfo, name, ext)
    case 'template':
      return execTemplate(rule.info as TemplateInfo, name, ext, index)
    default:
      return name + ext
  }
}

export function execRules(
  rules: Rule[],
  name: string,
  ext: string,
  index: number
): string {
  let currentName = name
  let currentExt = ext

  for (const rule of rules) {
    if (!rule.enabled) continue
    const result = execRule(rule, currentName, currentExt, index)
    ;({ name: currentName, ext: currentExt } = splitNameAndExt(result))
  }

  return currentName + currentExt
}
