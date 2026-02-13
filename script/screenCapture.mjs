import path from 'path'
import normalizePath from 'licia/normalizePath.js'
import isWindows from 'licia/isWindows.js'

const version = '1.0.0'
const url = `https://github.com/xland/ScreenCapture/releases/download/${version}/ScreenCapture.exe`

if (isWindows) {
  const dir = normalizePath(path.resolve(__dirname, '../resources'))
  await $`curl -Lk ${url} > ${dir}/ScreenCapture.exe`
}
