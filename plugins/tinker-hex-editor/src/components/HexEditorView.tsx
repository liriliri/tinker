import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import HexEditor from 'react-hex-editor'
import { ThemeProvider } from 'styled-components'
import store from '../store'

export default observer(function HexEditorView() {
  const handleSetValue = useCallback((offset: number, value: number) => {
    store.setValue(offset, value)
  }, [])

  // Light theme
  const lightTheme = {
    hexEditor: {
      asciiPaddingX: 0,
      bytePaddingX: '0.1em',
      rowPaddingY: '0.1em',
      colorBackground: '#ffffff',
      colorBackgroundEven: '#ffffff',
      colorBackgroundOdd: '#f6f8fa',
      colorBackgroundColumnEven: '#ffffff',
      colorBackgroundColumnOdd: '#f6f8fa',
      colorBackgroundRowEven: '#ffffff',
      colorBackgroundRowOdd: '#f6f8fa',
      colorBackgroundCursor: '#f1f8ff',
      colorBackgroundCursorHighlight: '#c8e1ff',
      colorBackgroundInactiveCursor: '#fffbdd',
      colorBackgroundInactiveCursorHighlight: '#fffbdd',
      colorBackgroundSelection: '#0366d6',
      colorBackgroundSelectionCursor: '#005cc5',
      colorBackgroundInactiveSelection: '#e6ebf1',
      colorBackgroundInactiveSelectionCursor: '#e6ebf1',
      colorBackgroundLabel: '#f6f8fa',
      colorBackgroundLabelCurrent: '#ffffff',
      colorText: '#24292e',
      colorTextEven: '#24292e',
      colorTextOdd: '#24292e',
      colorTextColumnEven: '#24292e',
      colorTextColumnOdd: '#24292e',
      colorTextRowEven: '#24292e',
      colorTextRowOdd: '#24292e',
      colorTextCursor: '#1074e7',
      colorTextCursorHighlight: '#0366d6',
      colorTextInactiveCursor: '#735c0f',
      colorTextInactiveCursorHighlight: '#735c0f',
      colorTextSelection: '#ffffff',
      colorTextSelectionCursor: '#ffffff',
      colorTextInactiveSelection: '#586069',
      colorTextInactiveSelectionCursor: '#586069',
      colorTextLabel: '#586069',
      colorTextLabelCurrent: '#24292e',
      colorScrollbackTrack: '#f6f8fa',
      colorScrollbackThumb: '#c6cbd1',
      colorScrollbackThumbHover: '#959da5',
      fontFamily: 'monospace',
      fontSize: '14px',
      gutterWidth: '0.5em',
      cursorBlinkSpeed: '0.5s',
      labelPaddingX: '0.5em',
      scrollWidth: 'auto',
      textTransform: 'uppercase',
    },
  }

  // Dark theme (based on One Dark Pro)
  const darkTheme = {
    hexEditor: {
      asciiPaddingX: 0,
      bytePaddingX: '0.1em',
      rowPaddingY: '0.1em',
      colorBackground: '#1e1e1e',
      colorBackgroundEven: '#1e1e1e',
      colorBackgroundOdd: '#252526',
      colorBackgroundColumnEven: '#1e1e1e',
      colorBackgroundColumnOdd: '#252526',
      colorBackgroundRowEven: '#1e1e1e',
      colorBackgroundRowOdd: '#252526',
      colorBackgroundCursor: '#5c6370',
      colorBackgroundCursorHighlight: '#7f848e',
      colorBackgroundInactiveCursor: '#5c6370',
      colorBackgroundInactiveCursorHighlight: '#5c6370',
      colorBackgroundSelection: '#264f78',
      colorBackgroundSelectionCursor: '#0078d4',
      colorBackgroundInactiveSelection: '#5c6370',
      colorBackgroundInactiveSelectionCursor: '#5c6370',
      colorBackgroundLabel: '#252526',
      colorBackgroundLabelCurrent: '#1e1e1e',
      colorText: '#d4d4d4',
      colorTextEven: '#d4d4d4',
      colorTextOdd: '#d4d4d4',
      colorTextColumnEven: '#d4d4d4',
      colorTextColumnOdd: '#d4d4d4',
      colorTextRowEven: '#d4d4d4',
      colorTextRowOdd: '#d4d4d4',
      colorTextCursor: '#ffffff',
      colorTextCursorHighlight: '#ffffff',
      colorTextInactiveCursor: '#d4d4d4',
      colorTextInactiveCursorHighlight: '#d4d4d4',
      colorTextSelection: '#ffffff',
      colorTextSelectionCursor: '#ffffff',
      colorTextInactiveSelection: '#cccccc',
      colorTextInactiveSelectionCursor: '#cccccc',
      colorTextLabel: '#858585',
      colorTextLabelCurrent: '#cccccc',
      colorScrollbackTrack: '#1e1e1e',
      colorScrollbackThumb: '#424242',
      colorScrollbackThumbHover: '#4e4e4e',
      fontFamily: 'monospace',
      fontSize: '14px',
      gutterWidth: '0.5em',
      cursorBlinkSpeed: '0.5s',
      labelPaddingX: '0.5em',
      scrollWidth: 'auto',
      textTransform: 'uppercase',
    },
  }

  const theme = store.isDark ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={theme}>
      <div className="w-full h-full p-4 flex justify-center">
        <div className="max-w-full">
          <HexEditor
            columns={0x10}
            data={store.data}
            nonce={store.nonce}
            onSetValue={handleSetValue}
            showAscii={true}
            showColumnLabels={true}
            showRowLabels={true}
          />
        </div>
      </div>
    </ThemeProvider>
  )
})
