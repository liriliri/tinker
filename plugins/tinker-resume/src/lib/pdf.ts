import map from 'licia/map'
import splitPath from 'licia/splitPath'
import startWith from 'licia/startWith'
import uuid from 'licia/uuid'
import { fileExists, joinPath } from 'share/lib/util'

export const RESUME_PAGE_ID = 'resume-paper'

const PRINT_CSS = `
@page { size: A4; margin: 0; }
html, body {
  margin: 0;
  padding: 0;
}
#${RESUME_PAGE_ID} {
  box-shadow: none !important;
  overflow: visible !important;
  width: 210mm;
  min-height: 297mm;
}
`

function collectPageCss() {
  return [
    PRINT_CSS,
    ...map(Array.from(document.styleSheets), (sheet) => {
      try {
        return map(Array.from(sheet.cssRules), (rule) => rule.cssText).join(
          '\n'
        )
      } catch {
        return ''
      }
    }),
  ].join('\n')
}

function buildPrintHtml(paper: HTMLElement) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${collectPageCss()}</style>
</head>
<body class="bg-white">${paper.outerHTML}</body>
</html>`
}

function toFileUrl(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/')
  return startWith(normalized, '/')
    ? `file://${normalized}`
    : `file:///${normalized}`
}

function printWebviewToPdf(src: string) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const webview = document.createElement('webview') as Electron.WebviewTag
    webview.style.cssText =
      'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;opacity:0;pointer-events:none'
    webview.setAttribute('disablewebsecurity', 'on')

    const cleanup = () => {
      webview.remove()
    }

    webview.addEventListener('did-fail-load', () => {
      cleanup()
      reject(new Error('Failed to load resume for PDF export'))
    })

    webview.addEventListener('did-finish-load', () => {
      void (async () => {
        try {
          await webview.executeJavaScript(
            'document.fonts ? document.fonts.ready.then(() => true) : true'
          )
          const data = await webview.printToPDF({
            printBackground: true,
            preferCSSPageSize: true,
            pageSize: 'A4',
            margins: { marginType: 'none' },
          })
          cleanup()
          resolve(new Uint8Array(data))
        } catch (error) {
          cleanup()
          reject(error)
        }
      })()
    })

    document.body.appendChild(webview)
    webview.src = src
  })
}

export async function exportResumePdf(path: string) {
  const dir = splitPath(path).dir
  if (!(await fileExists(dir))) {
    throw new Error(`Output directory not found: ${dir}`)
  }

  const paper = document.getElementById(RESUME_PAGE_ID)
  if (!paper) throw new Error('Resume preview not found')

  const tempDir = await tinker.getPath('temp')
  const htmlPath = joinPath(tempDir, `tinker-resume-${uuid()}.html`)
  await tinker.writeFile(htmlPath, buildPrintHtml(paper))

  try {
    const pdf = await printWebviewToPdf(toFileUrl(htmlPath))
    await tinker.writeFile(path, pdf)
  } finally {
    await tinker.rm(htmlPath).catch(() => undefined)
  }

  return path
}
