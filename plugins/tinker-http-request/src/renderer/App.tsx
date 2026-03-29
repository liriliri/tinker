import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import UrlBar from './components/UrlBar'
import RequestPanel from './components/RequestPanel'
import ResponsePanel from './components/ResponsePanel'

export default observer(function App() {
  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.primary} ${tw.text.primary}`}
    >
      <UrlBar />
      <div className={`flex-1 flex flex-col min-h-0 border-b ${tw.border}`}>
        <RequestPanel />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <ResponsePanel />
      </div>
    </div>
  )
})
