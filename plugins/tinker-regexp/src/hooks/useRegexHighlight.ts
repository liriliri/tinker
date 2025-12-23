import { useEffect, useRef, useCallback } from 'react'
import type CodeMirror from 'codemirror'
import { ExpressionLexer, type Token } from '../lib/ExpressionLexer'
import { javascriptProfile } from '../lib/profile'

interface HighlightOptions {
  onTokenHover?: (token: Token | null, event?: MouseEvent) => void
}

export function useRegexHighlight(
  editor: CodeMirror.Editor | null,
  pattern: string,
  options: HighlightOptions = {}
) {
  const lexerRef = useRef(new ExpressionLexer())
  const marksRef = useRef<CodeMirror.TextMarker[]>([])
  const hoverMarksRef = useRef<CodeMirror.TextMarker[]>([])
  const hoverTokenRef = useRef<Token | null>(null)

  // Set profile
  useEffect(() => {
    lexerRef.current.profile = javascriptProfile
  }, [])

  // Clear all marks
  const clearMarks = useCallback(() => {
    marksRef.current.forEach((mark) => mark.clear())
    marksRef.current = []
  }, [])

  // Clear hover marks
  const clearHoverMarks = useCallback(() => {
    hoverMarksRef.current.forEach((mark) => mark.clear())
    hoverMarksRef.current = []
  }, [])

  // Calculate token position in CodeMirror
  // Note: We subtract 1 from token.i because the lexer parses "/pattern/"
  // but the editor only contains "pattern" (/ is outside the editor)
  const calcTokenPos = useCallback(
    (editor: CodeMirror.Editor, token: Token) => {
      const doc = editor.getDoc()
      const offset = token.i - 1 // Adjust for the leading / not in editor
      token.startPos = doc.posFromIndex(offset)
      token.endPos = doc.posFromIndex(offset + token.l)
    },
    []
  )

  // Draw highlights
  const drawHighlights = useCallback(
    (editor: CodeMirror.Editor, token: Token | null) => {
      clearMarks()
      if (!token) return

      const doc = editor.getDoc()
      const marks: CodeMirror.TextMarker[] = []

      // Group class mapping by type (matches RegExr implementation)
      const groupClassByType: Record<string, string> = {
        set: 'exp-group-set',
        setnot: 'exp-group-set',
        group: 'exp-group-%depth%',
        lookaround: 'exp-group-%depth%',
      }

      let currentToken: Token | null = token
      while (currentToken) {
        // Skip the leading and trailing / tokens and ignored tokens
        if (
          !currentToken.ignore &&
          currentToken.type !== 'open' &&
          currentToken.type !== 'close'
        ) {
          calcTokenPos(editor, currentToken)

          // Add class based on token type
          let className = `exp-${currentToken.clss || currentToken.type}`

          // Add error class
          if (currentToken.error) {
            className += ` exp-${
              currentToken.error.warning ? 'warning' : 'error'
            }`
          }

          marks.push(
            doc.markText(currentToken.startPos!, currentToken.endPos!, {
              className: className,
            })
          )

          // Add group/set highlighting for paired tokens
          if (currentToken.close) {
            calcTokenPos(editor, currentToken.close)
            const tokenType = currentToken.clss || currentToken.type
            let groupClass = groupClassByType[tokenType]

            if (groupClass) {
              // Replace %depth% placeholder with actual depth
              groupClass = groupClass.replace(
                '%depth%',
                String(Math.min(currentToken.depth || 0, 3))
              )
              marks.push(
                doc.markText(
                  currentToken.startPos!,
                  currentToken.close.endPos!,
                  {
                    className: groupClass,
                  }
                )
              )
            }
          }
        }

        currentToken = currentToken.next || null
      }

      marksRef.current = marks
    },
    [clearMarks, calcTokenPos]
  )

  // Find token at position (matches RegExr implementation)
  const getTokenAtIndex = useCallback(
    (token: Token | null, index: number): Token | null => {
      let current: Token | null = token
      let target: Token | null = null

      // Adjust index for the leading / not in editor
      const adjustedIndex = index + 1

      // First pass: find the token at the index
      while (current) {
        if (
          adjustedIndex >= current.i &&
          adjustedIndex < current.i + current.l
        ) {
          target = current
          break
        }
        current = current.next || null
      }

      // Second pass: resolve open and proxy references
      // Priority: open > proxy (matches RegExr line 54-58)
      while (target) {
        if (target.open) {
          target = target.open
        } else if (target.proxy) {
          target = target.proxy
        } else {
          break
        }
      }

      return target
    },
    []
  )

  // Handle hover (matches RegExr implementation)
  const handleHover = useCallback(
    (editor: CodeMirror.Editor, token: Token | null, event: MouseEvent) => {
      const coords = editor.coordsChar({
        left: event.clientX,
        top: event.clientY,
      })
      const index = editor.indexFromPos(coords)

      const hoveredToken = getTokenAtIndex(token, index)

      // Don't update if it's the same token
      if (hoveredToken === hoverTokenRef.current) return

      // Don't update if hovering within the same range set (e.g., a-z)
      // This prevents flickering when moving between parts of a range
      if (
        hoveredToken &&
        hoveredToken.set &&
        hoverTokenRef.current &&
        hoveredToken.set.indexOf(hoverTokenRef.current) !== -1
      ) {
        return
      }

      hoverTokenRef.current = hoveredToken
      clearHoverMarks()

      if (hoveredToken) {
        const doc = editor.getDoc()
        const marks: CodeMirror.TextMarker[] = []

        // Helper function to draw select marks (matches RegExr implementation)
        const drawSelect = (token: Token, style: string = 'exp-selected') => {
          let startTok = token
          let endTok = token.close || token

          if (token.set) {
            // Handle ranges (e.g., a-z)
            const rangeTokens = token.set
            startTok = rangeTokens[0]
            endTok = rangeTokens[rangeTokens.length - 1]
          }

          calcTokenPos(editor, startTok)
          calcTokenPos(editor, endTok)
          marks.push(
            doc.markText(startTok.startPos!, endTok.endPos!, {
              className: style,
              startStyle: style + '-left',
              endStyle: style + '-right',
            })
          )
        }

        // Highlight the hovered token
        // Note: hoveredToken has already been resolved through getTokenAtIndex
        // so we don't need to check token.open again
        drawSelect(hoveredToken)

        // Highlight related tokens
        if (hoveredToken.related) {
          hoveredToken.related.forEach((relToken) => {
            drawSelect(relToken, 'exp-related')
          })
        }

        hoverMarksRef.current = marks
      }

      if (onTokenHoverRef.current) {
        onTokenHoverRef.current(hoveredToken, event)
      }
    },
    [getTokenAtIndex, clearHoverMarks, calcTokenPos]
  )

  // Store the current token in a ref so hover can access it
  const tokenRef = useRef<Token | null>(null)

  // Parse and draw highlights (only when pattern changes)
  useEffect(() => {
    if (!editor) return

    const lexer = lexerRef.current
    const token = lexer.parse('/' + pattern + '/')
    tokenRef.current = token

    drawHighlights(editor, token)
  }, [editor, pattern, drawHighlights])

  // Store options callback in a ref to avoid recreating listeners
  const onTokenHoverRef = useRef(options.onTokenHover)
  useEffect(() => {
    onTokenHoverRef.current = options.onTokenHover
  }, [options.onTokenHover])

  // Set up hover listeners (only once when editor is ready)
  useEffect(() => {
    if (!editor) return

    const wrapper = editor.getWrapperElement()

    const handleMouseMove = (event: MouseEvent) => {
      // Use tokenRef.current to get the latest token
      handleHover(editor, tokenRef.current, event)
    }

    const handleMouseLeave = () => {
      clearHoverMarks()
      hoverTokenRef.current = null
      if (onTokenHoverRef.current) {
        onTokenHoverRef.current(null)
      }
    }

    wrapper.addEventListener('mousemove', handleMouseMove)
    wrapper.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      wrapper.removeEventListener('mousemove', handleMouseMove)
      wrapper.removeEventListener('mouseleave', handleMouseLeave)
      clearMarks()
      clearHoverMarks()
    }
  }, [editor, handleHover, clearMarks, clearHoverMarks])

  return {
    errors: lexerRef.current.errors,
  }
}
