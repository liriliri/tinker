import { Command } from 'commander'
import { normalizePluginId } from './util'

type PluginListItem = {
  id: string
  name: string
  description?: string
  version?: string
  builtin: boolean
  mcp: boolean
  background: boolean
}

type ExecuteCommand = (
  command: string,
  data?: Record<string, unknown>,
  options?: { format?: (data: unknown) => void }
) => void

function formatPluginList(data: unknown) {
  const plugins = data as PluginListItem[]
  if (plugins.length === 0) {
    console.log('No plugins installed.')
    return
  }
  for (const p of plugins) {
    const version = !p.builtin && p.version ? ` (${p.version})` : ''
    const tags = [
      p.builtin ? 'builtin' : '',
      p.mcp ? 'mcp' : '',
      p.background ? 'background' : '',
    ]
      .filter(Boolean)
      .map((tag) => `[${tag}]`)
      .join(' ')
    const tag = tags ? ` ${tags}` : ''
    const description = p.description ? ` - ${p.description}` : ''
    console.log(`  ${p.id}${version}${tag}${description}`)
  }
}

function formatPluginListShort(data: unknown) {
  const plugins = data as PluginListItem[]
  if (plugins.length === 0) {
    console.log('No plugins installed.')
    return
  }
  for (const p of plugins) {
    console.log(p.id)
  }
}

function filterPluginsByIds(
  plugins: PluginListItem[],
  ids: string[]
): PluginListItem[] {
  const byId = new Map(plugins.map((p) => [p.id, p]))
  const result: PluginListItem[] = []
  const missing: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    const plugin = byId.get(id)
    if (plugin) {
      result.push(plugin)
    } else {
      missing.push(id)
    }
  }
  if (missing.length > 0) {
    throw new Error(`Plugin not found: ${missing.join(', ')}`)
  }
  return result
}

export function registerListCommand(
  program: Command,
  executeCommand: ExecuteCommand
) {
  program
    .command('list [plugins...]')
    .description('List installed plugins')
    .option('--short', 'List all plugin ids only (not with specific ids)')
    .action((plugins: string[], opts: { short?: boolean }) => {
      if (opts.short && plugins.length > 0) {
        console.error('Error: --short cannot be used with specific plugin ids')
        process.exit(1)
      }
      const format = opts.short ? formatPluginListShort : formatPluginList
      const ids = plugins.map(normalizePluginId)
      executeCommand('list', undefined, {
        format: (data) => {
          const all = data as PluginListItem[]
          format(ids.length > 0 ? filterPluginsByIds(all, ids) : all)
        },
      })
    })
}
