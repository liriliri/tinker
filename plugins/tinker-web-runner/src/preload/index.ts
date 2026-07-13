import { contextBridge } from 'electron'
import http from 'http'

let currentHtml = ''
let currentCss = ''
let currentJs = ''
let currentDark = false
let serverPort = 0

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })

  let html = currentHtml
  const darkMeta = currentDark
    ? '<meta name="color-scheme" content="dark"><style>:root{color-scheme:dark}body{background:#1e1e1e;color:#d4d4d4}</style>'
    : '<meta name="color-scheme" content="light"><style>:root{color-scheme:light}body{background:#ffffff;color:#1e1e1e}</style>'

  if (!html.includes('<html')) {
    html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
${darkMeta}
<style>${currentCss}</style>
</head>
<body>
${html}
<script>${currentJs}</script>
</body>
</html>`
  } else {
    // Inject CSS and JS into existing HTML
    if (currentCss || darkMeta) {
      const styleTag = `${darkMeta}<style>${currentCss}</style>`
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styleTag}</head>`)
      } else {
        html = styleTag + html
      }
    }
    if (currentJs) {
      const scriptTag = `<script>${currentJs}</script>`
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}</body>`)
      } else {
        html = html + scriptTag
      }
    }
  }

  res.end(html)
})

server.listen(0, '127.0.0.1', () => {
  const addr = server.address()
  if (addr && typeof addr !== 'string') {
    serverPort = addr.port
  }
})

const api = {
  getPort(): number {
    return serverPort
  },
  updateCode(html: string, css: string, js: string, dark: boolean): void {
    currentHtml = html
    currentCss = css
    currentJs = js
    currentDark = dark
  },
}

contextBridge.exposeInMainWorld('webRunner', api)

declare global {
  const webRunner: typeof api
}
