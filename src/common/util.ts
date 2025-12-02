import defaults from 'licia/defaults'
import enUS from './langs/en-US.json'
import zhCN from './langs/zh-CN.json'
export { t, i18n } from 'share/common/i18n'
import { init as initI18n } from 'share/common/i18n'

const langs = {
  'en-US': enUS,
  'zh-CN': defaults(zhCN, enUS),
}

initI18n(langs)
