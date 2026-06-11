import { addI18nNamespace } from '../../lib/i18n'

export const I18N_NS = 'terminalPanel'

addI18nNamespace(I18N_NS, {
  'en-US': {
    splitVertical: 'Split Vertically',
    splitHorizontal: 'Split Horizontally',
    closePane: 'Close',
    dualColumns: 'Dual Columns',
    tripleColumns: 'Triple Columns',
    gridLayout: 'Grid',
  },
  'zh-CN': {
    splitVertical: '垂直拆分',
    splitHorizontal: '水平拆分',
    closePane: '关闭',
    dualColumns: '双列',
    tripleColumns: '三列',
    gridLayout: '网格',
  },
})
