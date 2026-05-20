import AdmZip from 'adm-zip'
import path from 'path'
import iconv from 'iconv-lite'
import contain from 'licia/contain'
import types from 'licia/types'
import each from 'licia/each'
import { isDev } from 'share/common/util'

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

export function zipFiles(files: types.PlainObj<string | Uint8Array>): Buffer {
  const zip = new AdmZip()
  each(files, (content, name) => {
    if (typeof content === 'string') {
      zip.addFile(name, Buffer.from(content, 'utf-8'))
    } else {
      zip.addFile(name, Buffer.from(content))
    }
  })
  return zip.toBuffer()
}

export function unzipFiles(buf: Buffer): types.PlainObj<string | Uint8Array> {
  const files: types.PlainObj<string | Uint8Array> = {}
  const zip = new AdmZip(buf)
  zip.getEntries().forEach((entry) => {
    if (entry.entryName.endsWith('.bin')) {
      files[entry.entryName] = new Uint8Array(entry.getData())
    } else {
      files[entry.entryName] = entry.getData().toString('utf-8')
    }
  })
  return files
}

export function resolveResources(name: string): string {
  if (isDev()) {
    return path.resolve(__dirname, '../../', `resources/${name}`)
  }

  const ret = path.resolve(__dirname, '../', `resources/${name}`)
  if (contain(ret, 'app.asar')) {
    return path.resolve(process.resourcesPath, name)
  }

  return ret
}

export function decodeStr(latin1Str: string): string {
  if (/^[\x00-\x7f]*$/.test(latin1Str)) {
    return latin1Str
  }

  const buf = Buffer.from(latin1Str, 'latin1')
  const utf8 = buf.toString('utf8')

  if (utf8.includes('\ufffd')) {
    return iconv.decode(buf, 'gbk')
  }

  if (isDoubleEncodedGbk(utf8)) {
    const rawBytes = Buffer.from([...utf8].map((c) => c.charCodeAt(0)))
    return iconv.decode(rawBytes, 'gbk')
  }

  return utf8
}

function isDoubleEncodedGbk(str: string): boolean {
  const nonAscii = [...str].filter((c) => c.charCodeAt(0) > 0x7f)
  return nonAscii.length > 0 && nonAscii.every((c) => c.charCodeAt(0) <= 0xff)
}
