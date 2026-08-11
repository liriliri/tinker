import path from 'path'
import normalizePath from 'licia/normalizePath.js'
import isWindows from 'licia/isWindows.js'

const dir = normalizePath(path.resolve(__dirname, '../resources'))

const screenCaptureVersion = '1.0.0'
const screenCaptureUrl = `https://github.com/xland/ScreenCapture/releases/download/${screenCaptureVersion}/ScreenCapture.exe`

if (isWindows) {
  await $`curl -Lk ${screenCaptureUrl} > ${dir}/ScreenCapture.exe`
}

const everythingUrl =
  'https://raw.githubusercontent.com/liriliri/electron-resources/master/everything/everything-x64.zip'

if (isWindows) {
  await $`curl -Lk ${everythingUrl} > ${dir}/everything-x64.zip`
  await $`unzip -o ${dir}/everything-x64.zip -d ${dir}/everything`
  await $`rm ${dir}/everything-x64.zip`
}

// Full npm tree for plugin install/update. Shipped via extraResources so
// ELECTRON_RUN_AS_NODE can run it outside asar.
const npmVersion = '11.13.0'
cd(path.resolve(__dirname, '..'))
const npmDir = 'resources/npm'
const npmTgz = (await $`npm pack npm@${npmVersion}`).stdout.trim()
await fs.remove(npmDir)
await fs.mkdir(npmDir)
await $`tar -xzf ${npmTgz} -C ${npmDir} --strip-components=1`
await fs.remove(npmTgz)
