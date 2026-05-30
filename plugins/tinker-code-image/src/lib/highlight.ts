import CodeMirror from 'codemirror'
import escape from 'licia/escape'

export function highlightCode(code: string, mode: string): string {
  let html = ''
  let lineNum = 1
  let buffer = `<span class="line" data-line="${lineNum}">`

  CodeMirror.runMode(code, mode, (text: string, style: string | null) => {
    const parts = text.split('\n')
    parts.forEach((part, idx) => {
      if (idx > 0) {
        buffer += '</span>'
        html += buffer + '\n'
        lineNum++
        buffer = `<span class="line" data-line="${lineNum}">`
      }
      if (!part) return
      const escaped = escape(part)
      if (style) {
        const cls = style
          .split(' ')
          .map((s) => `cm-${s}`)
          .join(' ')
        buffer += `<span class="${cls}">${escaped}</span>`
      } else {
        buffer += escaped
      }
    })
  })

  buffer += '</span>'
  html += buffer
  return `<pre><code>${html}</code></pre>`
}
