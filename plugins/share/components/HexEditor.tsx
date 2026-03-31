import HexEditorLib from 'react-hex-editor'
import { ThemeProvider } from 'styled-components'

const LIGHT_THEME = {
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

// Based on One Dark Pro
const DARK_THEME = {
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

interface HexEditorProps {
  data: Uint8Array
  nonce: number
  isDark: boolean
  onSetValue: (offset: number, value: number) => void
  columns?: number
  showAscii?: boolean
  showColumnLabels?: boolean
  showRowLabels?: boolean
  className?: string
}

export default function HexEditor({
  data,
  nonce,
  isDark,
  onSetValue,
  columns = 0x10,
  showAscii = true,
  showColumnLabels = true,
  showRowLabels = true,
  className,
}: HexEditorProps) {
  const theme = isDark ? DARK_THEME : LIGHT_THEME

  return (
    <ThemeProvider theme={theme}>
      <div
        className={`w-full h-full p-4 flex justify-center ${className || ''}`}
      >
        <div className="max-w-full">
          <HexEditorLib
            columns={columns}
            data={data}
            nonce={nonce}
            onSetValue={onSetValue}
            showAscii={showAscii}
            showColumnLabels={showColumnLabels}
            showRowLabels={showRowLabels}
          />
        </div>
      </div>
    </ThemeProvider>
  )
}
