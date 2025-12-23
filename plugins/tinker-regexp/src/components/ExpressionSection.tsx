import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flag } from 'lucide-react'
import type CodeMirror from 'codemirror'
import { tw } from 'share/theme'
import store from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'
import FlagsPanel from './FlagsPanel'
import Tooltip from 'share/components/Tooltip'
import { useRegexHighlight } from '../hooks/useRegexHighlight'
import { getTipForToken } from '../lib/reference'
import type { Token } from '../lib/ExpressionLexer'

export default observer(function ExpressionSection() {
  const { t } = useTranslation()
  const [editor, setEditor] = useState<CodeMirror.Editor | null>(null)
  const [showFlags, setShowFlags] = useState(false)
  const [tooltip, setTooltip] = useState<{
    content: string | null
    x: number
    y: number
    visible: boolean
  }>({
    content: null,
    x: 0,
    y: 0,
    visible: false,
  })

  const handleTokenHover = (token: Token | null, event?: MouseEvent) => {
    if (!token || !event) {
      setTooltip({ content: null, x: 0, y: 0, visible: false })
      return
    }

    const tipContent = getTipForToken(token)
    setTooltip({
      content: tipContent,
      x: event.clientX,
      y: event.clientY + 20,
      visible: true,
    })
  }

  useRegexHighlight(editor, store.pattern, {
    onTokenHover: handleTokenHover,
  })

  return (
    <div
      className={`border-b ${tw.border.both} ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
    >
      <div className="relative px-6 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`${tw.text.light.tertiary} ${tw.text.dark.tertiary} text-xl`}
          >
            /
          </span>
          <div className="flex-1">
            <CodeMirrorEditor
              value={store.pattern}
              onChange={(val) => store.setPattern(val)}
              singleLine
              className="regexp-editor"
              placeholder={t('patternPlaceholder')}
              onEditorReady={setEditor}
            />
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`${tw.text.light.tertiary} ${tw.text.dark.tertiary} text-xl cursor-pointer hover:${tw.text.light.secondary} dark:hover:${tw.text.dark.secondary} transition-colors`}
            >
              /{store.flags}
            </span>
            <button
              onClick={() => setShowFlags(!showFlags)}
              className={`${tw.text.light.tertiary} ${tw.text.dark.tertiary} hover:${tw.text.light.primary} dark:hover:${tw.text.dark.primary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-all p-1.5 rounded`}
              title={t('flags')}
            >
              <Flag size={20} />
            </button>
          </div>
        </div>
        {showFlags && (
          <>
            <div
              className="fixed inset-0 z-0"
              onClick={() => setShowFlags(false)}
            />
            <FlagsPanel />
          </>
        )}
      </div>
      <Tooltip
        content={
          tooltip.content && (
            <div dangerouslySetInnerHTML={{ __html: tooltip.content }} />
          )
        }
        x={tooltip.x}
        y={tooltip.y}
        visible={tooltip.visible}
      />
    </div>
  )
})
