import AdmZip from 'adm-zip'
import types from 'licia/types'
import each from 'licia/each'

export function injectRendererScript(str: string) {
  const script = document.createElement('script')
  script.textContent = str
  document.documentElement.appendChild(script)
  document.documentElement.removeChild(script)
}

export function domReady(callback: () => void) {
  const observer = new MutationObserver(() => {
    if (document.documentElement) {
      observer.disconnect()
      callback()
    }
  })
  observer.observe(document, { childList: true })
}

export function zipFiles(files: types.PlainObj<string>): Buffer {
  const zip = new AdmZip()
  each(files, (content, name) => {
    zip.addFile(name, Buffer.from(content, 'utf-8'))
  })
  return zip.toBuffer()
}

export function unzipFiles(buf: Buffer): types.PlainObj<string> {
  const files: types.PlainObj<string> = {}
  const zip = new AdmZip(buf)
  zip.getEntries().forEach((entry) => {
    files[entry.entryName] = entry.getData().toString('utf-8')
  })
  return files
}
