import { Editor } from '@monaco-editor/react'
import { observer } from 'mobx-react-lite'
import store from '../store'
import { getLanguage } from '../lib/util'

interface EditorPaneProps {
  tabId: string
}

export default observer(function EditorPane({ tabId }: EditorPaneProps) {
  const tab = store.tabs.find((t) => t.id === tabId)
  if (!tab) return null

  const handleChange = (value: string | undefined) => {
    store.updateContent(tabId, value || '')
  }

  return (
    <Editor
      language={getLanguage(tab.filePath)}
      value={tab.content}
      onChange={handleChange}
      theme={store.isDark ? 'vs-dark' : 'vs-light'}
      options={{
        minimap: { enabled: true },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'off',
        renderWhitespace: 'selection',
      }}
    />
  )
})
