import { observer } from 'mobx-react-lite'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import CodeMirror from 'codemirror'
import { tw } from 'share/theme'
import type { Match } from '../types'
import store from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'
import TextHighlighter from './TextHighlighter'
import Tooltip from 'share/components/Tooltip'

export default observer(function TextSection() {
  const { t } = useTranslation()
  const [editor, setEditor] = useState<CodeMirror.Editor | null>(null)
  const [hoverMatch, setHoverMatch] = useState<Match | null>(null)
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const getMatchAt = (index: number): Match | null => {
    const matches = store.matches
    if (!matches || !matches.length) return null

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const start = match.index
      const end = match.index + match.length

      if (start <= index && index < end) {
        return match
      }
    }
    return null
  }

  useEffect(() => {
    if (!editor) return

    const handleMouseMove = (e: MouseEvent) => {
      const coords = editor.coordsChar({ left: e.clientX, top: e.clientY })
      const index = editor.indexFromPos(coords)
      const match = getMatchAt(index)

      if (match) {
        setHoverMatch(match)
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY + 10,
        })
      } else {
        setHoverMatch(null)
        setTooltip({
          visible: false,
          x: 0,
          y: 0,
        })
      }
    }

    const handleMouseLeave = () => {
      setHoverMatch(null)
      setTooltip({
        visible: false,
        x: 0,
        y: 0,
      })
    }

    const lineDiv = editor
      .getWrapperElement()
      .querySelector('.CodeMirror-lines')
    if (lineDiv) {
      lineDiv.addEventListener('mousemove', handleMouseMove)
      lineDiv.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        lineDiv.removeEventListener('mousemove', handleMouseMove)
        lineDiv.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [editor, store.matches])

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
      <div
        className={`flex-1 overflow-hidden px-6 py-3 ${tw.bg.light.primary} ${tw.bg.dark.primary} relative`}
      >
        <CodeMirrorEditor
          value={store.testText}
          onChange={(val) => store.setTestText(val)}
          className="regexp-text-editor h-full"
          lineNumbers={false}
          onEditorReady={setEditor}
        />
        <TextHighlighter
          editor={editor}
          matches={store.matches}
          hoverMatch={hoverMatch}
          selectedMatch={null}
        />
        <Tooltip
          visible={tooltip.visible}
          x={tooltip.x}
          y={tooltip.y}
          content={
            hoverMatch && (
              <>
                <div className="mb-2">
                  <strong>{t('matchLabel')}:</strong> "{hoverMatch.text}"
                </div>
                <div
                  className={`${tw.text.light.secondary} ${tw.text.dark.secondary} text-xs`}
                >
                  {t('positionLabel')}: {hoverMatch.index} -{' '}
                  {hoverMatch.index + hoverMatch.length}
                </div>
                {hoverMatch.groups.length > 0 && (
                  <div className={`mt-2 pt-2 border-t ${tw.border.both}`}>
                    <div
                      className={`${tw.text.light.secondary} ${tw.text.dark.secondary} text-xs mb-1`}
                    >
                      {t('groupsLabel')}:
                    </div>
                    {hoverMatch.groups.map((group, i) => (
                      <div
                        key={i}
                        className={`${tw.text.light.secondary} ${tw.text.dark.secondary} text-xs`}
                      >
                        {i + 1}: {group || t('emptyGroup')}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )
          }
        />
      </div>
    </div>
  )
})
