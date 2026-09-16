import fs from 'fs'
import path from 'path'
import contain from 'licia/contain'
import startWith from 'licia/startWith'
import replaceAll from 'licia/replaceAll'
import { isDev } from 'share/common/util'
import type { IMcpToolDefinition } from 'common/types'

export function normalizePluginId(name: string) {
  if (startWith(name, '@')) {
    return replaceAll(name.slice(1), '/', '-')
  }
  if (startWith(name, 'tinker-') || contain(name, '-tinker-')) {
    return name
  }
  return `tinker-${name}`
}

/** Resolve relative paths that exist; leave other strings unchanged. */
export function resolveOpenArg(arg: string): string {
  if (path.isAbsolute(arg)) {
    return arg
  }
  const resolved = path.resolve(arg)
  return fs.existsSync(resolved) ? resolved : arg
}

export function hasOpenArgTool(
  tools?: Record<string, IMcpToolDefinition>
): boolean {
  const schema = tools?.open?.inputSchema as
    | { properties?: Record<string, unknown> }
    | undefined
  return !!(schema?.properties && 'arg' in schema.properties)
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
