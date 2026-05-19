import App from './components/App'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
