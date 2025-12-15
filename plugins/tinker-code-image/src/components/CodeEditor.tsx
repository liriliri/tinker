import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import store from '../store'

const CodeEditor = observer(() => {
  const [highlightedHtml, setHighlightedHtml] = useState('')

  useEffect(() => {
    const generateHighlightedHtml = async () => {
      if (!store.highlighter) return ''

      const loadedLanguages = store.highlighter.getLoadedLanguages() || []
      const hasLoadedLanguage = loadedLanguages.includes(
        store.selectedLanguage.name.toLowerCase()
      )

      if (!hasLoadedLanguage && store.selectedLanguage.src) {
        await store.highlighter.loadLanguage(store.selectedLanguage.src)
      }

      let lang = store.selectedLanguage.name.toLowerCase()
      if (lang === 'typescript') {
        lang = 'tsx'
      }

      return store.highlighter.codeToHtml(store.code, {
        lang: lang,
        theme: store.darkMode ? 'github-dark' : 'github-light',
      })
    }

    generateHighlightedHtml().then((html) => {
      setHighlightedHtml(html)
    })
  }, [store.code, store.selectedLanguage, store.highlighter, store.darkMode])

  return (
    <div
      className="code-editor-container"
      data-value={store.code}
      style={{
        display: 'grid',
        width: '100%',
        minHeight: 0,
        gridTemplate: 'auto / 1fr',
      }}
    >
      <textarea
        rows={1}
        className="code-editor-textarea"
        value={store.code}
        onChange={(e) => store.setCode(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          gridArea: '1 / 1 / 2 / 2',
          padding: '16px',
          margin: 0,
          fontFamily: 'monospace',
          fontSize: '15px',
          lineHeight: '22.5px',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          minHeight: 'min-content',
          border: 'none',
          background: 'transparent',
          caretColor: store.darkMode ? 'white' : 'black',
          resize: 'none',
          WebkitTextFillColor: 'transparent',
          outline: 'none',
          zIndex: 2,
          tabSize: 2,
        }}
      />
      <div
        className="code-editor-highlighted"
        style={{
          gridArea: '1 / 1 / 2 / 2',
          padding: '16px',
          margin: 0,
          fontFamily: 'monospace',
          fontSize: '15px',
          lineHeight: '22.5px',
          whiteSpace: 'pre-wrap',
          pointerEvents: 'none',
        }}
        dangerouslySetInnerHTML={{
          __html: highlightedHtml,
        }}
      />
    </div>
  )
})

export default CodeEditor
