import path from 'path'
import contain from 'licia/contain'
import { isDev } from 'share/common/util'

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
