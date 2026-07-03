import { addI18nNamespace } from '../../lib/i18n'

export const AI_CHAT_NS = 'aiChat'

const enUS = {
  delete: 'Delete',
  retry: 'Retry',
  stop: 'Stop',
  sendEnter: 'Send (Enter)',
  inputPlaceholder: 'Type a message...',
  emptyHint: 'Start a conversation',
  noProviders: 'No AI providers configured',
  errorPrefix: 'Error: ',
  systemPrompt: 'System Prompt',
  systemPromptPlaceholder: 'Optional system prompt...',
  settings: 'Settings',
  save: 'Save',
  cancel: 'Cancel',
  clearMessages: 'Clear Messages',
  searching: 'Searching',
  searchResults: 'results',
  searchFailed: 'Search failed',
}

const zhCN = {
  delete: '删除',
  retry: '重试',
  stop: '停止',
  sendEnter: '发送 (Enter)',
  inputPlaceholder: '输入消息…',
  emptyHint: '开始对话吧',
  noProviders: '未配置 AI 提供商',
  errorPrefix: '错误：',
  systemPrompt: '系统提示词',
  systemPromptPlaceholder: '可选的系统提示词…',
  settings: '设置',
  save: '保存',
  cancel: '取消',
  clearMessages: '清空消息',
  searching: '正在搜索',
  searchResults: '条结果',
  searchFailed: '搜索失败',
}

addI18nNamespace(AI_CHAT_NS, { 'en-US': enUS, 'zh-CN': zhCN })
