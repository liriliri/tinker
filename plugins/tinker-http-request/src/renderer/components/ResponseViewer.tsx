import { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import CopyButton from 'share/components/CopyButton'
import { tw } from 'share/theme'

interface ResponseViewerProps {
  body: string
}

export default observer(function ResponseViewer({ body }: ResponseViewerProps) {
  const { t } = useTranslation()

  const { displayBody, isJson } = useMemo(() => {
    let displayBody = body
    let isJson = false
    try {
      const parsed = JSON.parse(body)
      displayBody = JSON.stringify(parsed, null, 2)
      isJson = true
    } catch {
      // not JSON, display as-is
    }
    return { displayBody, isJson }
  }, [body])

  return (
    <div className="relative flex-1 min-h-0">
      <div className="absolute top-1 right-1 z-10">
        <CopyButton
          text={displayBody}
          variant="toolbar"
          title={t('copyBody')}
        />
      </div>
      <pre
        className={`w-full h-full overflow-auto p-3 text-xs font-mono ${
          tw.text.primary
        } ${isJson ? 'whitespace-pre' : 'whitespace-pre-wrap'}`}
      >
        {displayBody}
      </pre>
    </div>
  )
})
