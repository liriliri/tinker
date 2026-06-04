import { addI18nNamespace } from '../../lib/i18n'

export const FILE_TREE_NS = 'fileTree'

const enUS = {
  newFile: 'New File',
  newFolder: 'New Folder',
  rename: 'Rename',
  delete: 'Delete',
}

const zhCN = {
  newFile: '新建文件',
  newFolder: '新建文件夹',
  rename: '重命名',
  delete: '删除',
}

addI18nNamespace(FILE_TREE_NS, { 'en-US': enUS, 'zh-CN': zhCN })
