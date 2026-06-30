import { addI18nNamespace } from '../../lib/i18n'

export const PDF_VIEWER_NS = 'pdfViewer'

const viewerEnUS = {
  loading: 'Loading...',
  error: 'Failed to load PDF',
  page: 'Page {{pageNum}}',
  rendering: 'Rendering...',
  noOutline: 'No outline available',
}

const viewerZhCN = {
  loading: '加载中...',
  error: '无法加载 PDF',
  page: '第 {{pageNum}} 页',
  rendering: '渲染中...',
  noOutline: '无大纲',
}

addI18nNamespace(PDF_VIEWER_NS, {
  'en-US': viewerEnUS,
  'zh-CN': viewerZhCN,
})
