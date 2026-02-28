import { useEffect, useRef } from 'react'
import CodeMirror from 'codemirror'
import { THEME_COLORS } from 'share/theme'
import type { Match } from '../types'

interface TextHighlighterProps {
  editor: CodeMirror.Editor | null
  matches: Match[]
  hoverMatch: Match | null
  selectedMatch: Match | null
}

export default function TextHighlighter({
  editor,
  matches,
  hoverMatch,
  selectedMatch,
}: TextHighlighterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!editor || !canvasRef.current) return

    const canvas = canvasRef.current
    const editorWrapper = editor.getWrapperElement()
    const parent = editorWrapper.parentElement

    if (parent && !parent.contains(canvas)) {
      canvas.style.position = 'absolute'
      canvas.style.pointerEvents = 'none'
      canvas.style.zIndex = '1'
      parent.style.position = 'relative'
      parent.insertBefore(canvas, editorWrapper)
    }

    const updateCanvas = () => {
      const scrollInfo = editor.getScrollInfo()
      canvas.width = scrollInfo.clientWidth
      canvas.height = scrollInfo.clientHeight

      const rect = editorWrapper.getBoundingClientRect()
      canvas.style.left = `${
        rect.left - (parent?.getBoundingClientRect().left || 0)
      }px`
      canvas.style.top = `${
        rect.top - (parent?.getBoundingClientRect().top || 0)
      }px`
    }

    updateCanvas()

    editor.on('scroll', updateCanvas)
    editor.on('refresh', updateCanvas)

    return () => {
      editor.off('scroll', updateCanvas)
      editor.off('refresh', updateCanvas)
    }
  }, [editor])

  useEffect(() => {
    if (!editor || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!matches.length) return

    const doc = editor.getDoc()
    const scrollInfo = editor.getScrollInfo()

    const topCoords = editor.coordsChar(
      { left: 0, top: scrollInfo.top },
      'local'
    )
    const bottomCoords = editor.coordsChar(
      {
        left: scrollInfo.clientWidth,
        top: scrollInfo.top + scrollInfo.clientHeight,
      },
      'local'
    )
    const topIndex = editor.indexFromPos(topCoords)
    const bottomIndex = editor.indexFromPos(bottomCoords)

    matches.forEach((match) => {
      const start = match.index
      const end = match.index + match.length

      if (start > bottomIndex) return
      if (end < topIndex) return

      const isEmphasis = match === hoverMatch || match === selectedMatch

      const startPos = doc.posFromIndex(start)
      const endPos = doc.posFromIndex(Math.max(start, end - 1))

      const startRect = editor.charCoords(startPos, 'local')
      const endRect = editor.charCoords(endPos, 'local')

      if (isEmphasis) {
        ctx.fillStyle = 'rgba(64, 158, 255, 0.4)'
      } else {
        ctx.fillStyle = 'rgba(64, 158, 255, 0.2)'
      }

      if (startRect.bottom === endRect.bottom) {
        const top = startRect.top - scrollInfo.top
        const height = startRect.bottom - startRect.top
        const width = endRect.right - startRect.left
        ctx.fillRect(startRect.left, top, width, height)

        if (isEmphasis) {
          ctx.strokeStyle = THEME_COLORS.primary
          ctx.lineWidth = 2
          ctx.strokeRect(startRect.left, top, width, height)
        }
      } else {
        const lineHeight = editor.defaultTextHeight()
        const scrollWidth = scrollInfo.clientWidth

        let top = startRect.top - scrollInfo.top
        let height = startRect.bottom - startRect.top
        let width = scrollWidth - startRect.left
        ctx.fillRect(startRect.left, top, width, height)
        if (isEmphasis) {
          ctx.strokeStyle = THEME_COLORS.primary
          ctx.lineWidth = 2
          ctx.strokeRect(startRect.left, top, width, height)
        }

        let y = startRect.top
        while ((y += lineHeight) < endRect.top - 1) {
          top = y - scrollInfo.top
          ctx.fillRect(0, top, scrollWidth, height)
          if (isEmphasis) {
            ctx.strokeRect(0, top, scrollWidth, height)
          }
        }

        top = endRect.top - scrollInfo.top
        height = endRect.bottom - endRect.top
        width = endRect.right
        ctx.fillRect(0, top, width, height)
        if (isEmphasis) {
          ctx.strokeRect(0, top, width, height)
        }
      }
    })
  }, [editor, matches, hoverMatch, selectedMatch])

  return (
    <canvas
      ref={canvasRef}
      className="text-highlighter-canvas absolute pointer-events-none"
    />
  )
}
