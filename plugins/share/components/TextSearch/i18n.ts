import { addI18nNamespace } from '../../lib/i18n'

export const TEXT_SEARCH_NS = 'textSearch'

const enUS = {
  searchPlaceholder: 'Search',
  includesPlaceholder: 'files to include',
  excludesPlaceholder: 'files to exclude',

  caseSensitive: 'Match Case',
  wholeWord: 'Match Whole Word',
  regex: 'Use Regular Expression',
  toggleSearchDetails: 'Toggle Search Details',
  maxResults: 'Max results',
  clear: 'Clear',

  pickFolder: 'Choose Folder',
  noFolder: 'Open a folder to search',
  noQuery: 'Type to search',
  noResults: 'No results found',
  summary_one: '{{count}} result in {{files}} file',
  summary_other: '{{count}} results in {{files}} files',
  truncated: '(truncated)',

  showInFolder: 'Reveal in File Manager',
  copyPath: 'Copy Path',
  copyLine: 'Copy Match',
}

const zhCN = {
  searchPlaceholder: '搜索',
  includesPlaceholder: '包含的文件',
  excludesPlaceholder: '排除的文件',

  caseSensitive: '区分大小写',
  wholeWord: '全词匹配',
  regex: '使用正则表达式',
  toggleSearchDetails: '切换搜索详情',
  maxResults: '最大结果数',
  clear: '清除',

  pickFolder: '选择文件夹',
  noFolder: '打开文件夹以搜索',
  noQuery: '输入关键词开始搜索',
  noResults: '未找到结果',
  summary_one: '在 {{files}} 个文件中找到 {{count}} 个结果',
  summary_other: '在 {{files}} 个文件中找到 {{count}} 个结果',
  truncated: '(已截断)',

  showInFolder: '在文件管理器中显示',
  copyPath: '复制路径',
  copyLine: '复制匹配行',
}

addI18nNamespace(TEXT_SEARCH_NS, { 'en-US': enUS, 'zh-CN': zhCN })
