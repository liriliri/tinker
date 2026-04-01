import splitPath from 'licia/splitPath'
import type {
  Rule,
  RuleType,
  FileInfo,
  ReplaceInfo,
  InsertInfo,
  DeleteInfo,
  FormatInfo,
  TemplateInfo,
} from '../../common/types'

export function parseFile(fullPath: string): FileInfo {
  const { dir, name: fullName, ext } = splitPath(fullPath)

  return {
    name: fullName.slice(0, fullName.length - ext.length),
    ext,
    fullName,
    dir,
    fullPath,
  }
}

export function createDefaultInfo(type: RuleType): Rule['info'] {
  switch (type) {
    case 'replace':
      return {
        match: '',
        replace: '',
        useRegExp: false,
        caseSensitive: false,
        matchAll: true,
        includeExt: false,
      } as ReplaceInfo
    case 'insert':
      return {
        content: '',
        position: 'prefix',
      } as InsertInfo
    case 'delete':
      return {
        match: '',
        useRegExp: false,
        caseSensitive: false,
        matchAll: true,
      } as DeleteInfo
    case 'format':
      return {
        formatType: 'lower',
      } as FormatInfo
    case 'template':
      return {
        template: '',
      } as TemplateInfo
    default:
      return {
        match: '',
        replace: '',
        useRegExp: false,
        caseSensitive: false,
        matchAll: true,
        includeExt: false,
      } as ReplaceInfo
  }
}

export function ruleDescription(
  rule: Rule,
  t: (key: string) => string
): string {
  switch (rule.type) {
    case 'replace': {
      const info = rule.info as ReplaceInfo
      return `"${info.match}" → "${info.replace}"`
    }
    case 'insert': {
      const info = rule.info as InsertInfo
      return `${t(info.position)}: "${info.content}"`
    }
    case 'delete': {
      const info = rule.info as DeleteInfo
      return `"${info.match}"`
    }
    case 'format': {
      const info = rule.info as FormatInfo
      return t(info.formatType)
    }
    case 'template': {
      const info = rule.info as TemplateInfo
      return info.template || ''
    }
    default:
      return ''
  }
}
