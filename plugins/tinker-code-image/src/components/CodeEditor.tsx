import { observer } from 'mobx-react-lite'
import className from 'licia/className'
import store from '../store'
import { highlightCode } from '../lib/highlight'

export default observer(function CodeEditor() {
  const numberOfLines = (store.code.match(/\n/g) || []).length + 1
  const highlightedHtml = highlightCode(store.code, store.selectedLanguage.mode)

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
      className={className('code-editor-container', {
        'show-line-numbers': showLineNumbers,
      })}
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
