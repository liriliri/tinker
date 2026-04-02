import path from 'path'
import normalizePath from 'licia/normalizePath.js'
import isWindows from 'licia/isWindows.js'
import isMac from 'licia/isMac.js'

const dir = normalizePath(path.resolve(__dirname, '../resources'))

const screenCaptureVersion = '1.0.0'
const screenCaptureUrl = `https://github.com/xland/ScreenCapture/releases/download/${screenCaptureVersion}/ScreenCapture.exe`

if (isWindows) {
  await $`curl -Lk ${screenCaptureUrl} > ${dir}/ScreenCapture.exe`
}

const pduVersion = '0.21.1'
let pduFile
let pduOutput = 'pdu'
if (isWindows) {
  pduFile = `pdu-x86_64-pc-windows-msvc.exe`
  pduOutput = 'pdu.exe'
} else if (isMac) {
  pduFile = `pdu-x86_64-apple-darwin`
} else {
  pduFile = `pdu-x86_64-unknown-linux-gnu`
}
const pduUrl = `https://github.com/KSXGitHub/parallel-disk-usage/releases/download/${pduVersion}/${pduFile}`
await $`curl -Lk ${pduUrl} > ${dir}/${pduOutput}`
if (!isWindows) {
  await $`chmod +x ${dir}/${pduOutput}`
}
