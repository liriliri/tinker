import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import store, { shikiTheme } from '../store'

export default observer(function CodeEditor() {
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const numberOfLines = (store.code.match(/\n/g) || []).length + 1

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

      const lang = store.selectedLanguage.name.toLowerCase()

      return store.highlighter.codeToHtml(store.code, {
        lang: lang,
        theme: shikiTheme,
        transformers: [
          {
            line(node, line) {
              node.properties['data-line'] = line
              this.addClassToHast(node, 'line')
            },
          },
        ],
      })
    }

    generateHighlightedHtml().then((html) => {
      setHighlightedHtml(html)
    })
  }, [store.code, store.selectedLanguage, store.highlighter, store.darkMode, store.selectedTheme, store.showLineNumbers])

  const showLineNumbers = store.showLineNumbers
  const lineNumberPadding = showLineNumbers
    ? numberOfLines > 99
      ? '3.5rem'
      : '3rem'
    : '16px'

  const sharedStyles = {
    gridArea: '1 / 1 / 2 / 2',
    paddingLeft: lineNumberPadding,
    paddingRight: '16px',
    paddingTop: '16px',
    paddingBottom: '16px',
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '15px',
    lineHeight: '22.5px',
    whiteSpace: 'pre-wrap' as const,
    transition: 'padding 0.2s',
  }

  return (
    <div
      className={`code-editor-container ${
        showLineNumbers ? 'show-line-numbers' : ''
      }`}
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
          ...sharedStyles,
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
          ...sharedStyles,
          pointerEvents: 'none',
          ...store.themeCSS,
        }}
        dangerouslySetInnerHTML={{
          __html: highlightedHtml,
        }}
      />
    </div>
  )
})
