import { useMemo, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import HexEditor from 'share/components/HexEditor'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ResponseViewer() {
  const { response } = store

  if (!response) return null

  const mode = store.effectiveBodyMode

  if (mode === 'hex') {
    return <HexResponseViewer />
  }

  if (store.isImageResponse) {
    return <ImageResponseViewer />
  }

  return <TextResponseViewer />
})

const TextResponseViewer = observer(function TextResponseViewer() {
  const { response } = store

  if (!response) return null

  const { displayBody, language } = useMemo(() => {
    let displayBody = response.body
    let language = 'plaintext'
    const contentType = response.headers['content-type'] || ''

    if (
      contentType.includes('application/json') ||
      contentType.includes('+json')
    ) {
      language = 'json'
      try {
        const parsed = JSON.parse(response.body)
        displayBody = JSON.stringify(parsed, null, 2)
      } catch {
        // not valid JSON, display as-is
      }
    } else if (contentType.includes('xml') || contentType.includes('+xml')) {
      language = 'xml'
    } else if (contentType.includes('html')) {
      language = 'html'
    } else if (contentType.includes('javascript')) {
      language = 'javascript'
    } else if (contentType.includes('css')) {
      language = 'css'
    }

    return { displayBody, language }
  }, [response.body, response.headers])

  return (
    <div className={`w-full h-full p-3`}>
      <div
        className={`w-full h-full border ${tw.border} rounded overflow-hidden`}
      >
        <Editor
          value={displayBody}
          language={language}
          theme={store.isDark ? 'vs-dark' : 'vs'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineNumbers: 'off',
            folding: true,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
})

const ImageResponseViewer = observer(function ImageResponseViewer() {
  const { response } = store

  const url = useMemo(() => {
    if (!response) return ''
    const contentType = response.headers['content-type'] || ''
    const blob = new Blob([new Uint8Array(response.bodyBytes)], {
      type: contentType.split(';')[0],
    })
    return URL.createObjectURL(blob)
  }, [response])

  if (!url) return null

  return (
    <div className="w-full h-full p-3 flex items-center justify-center">
      <img
        src={url}
        className="max-w-full max-h-full object-contain"
        onLoad={() => URL.revokeObjectURL(url)}
        alt="Response"
      />
    </div>
  )
})

const HexResponseViewer = observer(function HexResponseViewer() {
  const { response } = store

  const { data, nonce } = useMemo(() => {
    if (!response) return { data: new Uint8Array(0), nonce: 0 }
    return { data: new Uint8Array(response.bodyBytes), nonce: 1 }
  }, [response])

  const handleSetValue = useCallback(() => {
    // read-only, no-op
  }, [])

  return (
    <HexEditor
      data={data}
      nonce={nonce}
      isDark={store.isDark}
      onSetValue={handleSetValue}
    />
  )
})
