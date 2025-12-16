import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { getHighlighterCore } from 'shiki'
import getWasm from 'shiki/wasm'
import store, { LANGUAGES, shikiTheme } from './store'
import Frame from './components/Frame'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  useEffect(() => {
    // Initialize Shiki highlighter
    getHighlighterCore({
      themes: [shikiTheme],
      langs: [
        LANGUAGES.javascript.src(),
        LANGUAGES.typescript.src(),
        LANGUAGES.python.src(),
      ],
      loadWasm: getWasm,
    }).then((highlighter) => {
      store.setHighlighter(highlighter as any)
    })
  }, [])

  if (!store.highlighter) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f0f1f2] dark:bg-[#303133]">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133]">
      <Toolbar />
      <Frame />
    </div>
  )
})
