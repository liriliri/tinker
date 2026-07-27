import path from 'path'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import replaceAll from 'licia/replaceAll'
import { isDev } from 'share/common/util'

export function normalizePluginId(name: string) {
  if (startWith(name, '@')) {
    return replaceAll(name.slice(1), '/', '-')
  }
  if (startWith(name, 'tinker-') || contain(name, '-tinker-')) {
    return name
  }
  return `tinker-${name}`
}

function resolve(p: string) {
  if (isDev()) {
    return path.resolve(__dirname, '../../', p)
  }
  return path.resolve(__dirname, '../', p)
}

export function resolveResources(p: string) {
  const ret = resolve(`resources/${p}`)

  if (!isDev() && contain(ret, 'app.asar')) {
    return path.resolve(process.resourcesPath, p)
  }

  return ret
}
