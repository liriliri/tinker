import { Command } from 'commander'
import { sendCommand } from './ipc'
import { startMcpServer } from './mcp'
import { runSkills } from './skills'
import type { IPlugin } from 'common/types'

interface ExecuteCommandOptions {
  format?: (data: unknown) => void
}

function normalizePluginId(name: string) {
  return name.startsWith('tinker-') ? name : `tinker-${name}`
}

function formatPluginList(data: unknown) {
  const plugins = data as Array<{
    id: string
    name: string
    description?: string
    version?: string
    builtin: boolean
    mcp: boolean
  }>
  if (plugins.length === 0) {
    console.log('No plugins installed.')
    return
  }
  for (const p of plugins) {
    const version = !p.builtin && p.version ? ` (${p.version})` : ''
    const tags = [p.builtin ? 'builtin' : '', p.mcp ? 'mcp' : '']
      .filter(Boolean)
      .map((tag) => `[${tag}]`)
      .join(' ')
    const tag = tags ? ` ${tags}` : ''
    const description = p.description ? ` - ${p.description}` : ''
    console.log(`  ${p.id}${version}${tag}${description}`)
  }
}

function formatRunningPlugins(data: unknown) {
  const running = data as Array<{ id: string; pid: number }>
  if (running.length === 0) {
    console.log('No running plugins.')
    return
  }
  for (const p of running) {
    console.log(`  ${p.id} ${p.pid}`)
  }
}

function formatPluginTools(data: unknown) {
  const plugin = data as IPlugin
  if (!plugin.mcp) {
    throw new Error(`${plugin.name} does not support MCP.`)
  }
  console.log(JSON.stringify(plugin.mcp.tools, null, 2))
}

function formatToolCallResult(data: unknown) {
  if (typeof data === 'string') {
    console.log(data)
    return
  }
  console.log(JSON.stringify(data, null, 2))
}

async function executeCommand(
  command: string,
  data?: Record<string, unknown>,
  options?: ExecuteCommandOptions
) {
  let res
  try {
    res = await sendCommand(command, data)
  } catch (err: any) {
    console.error(`Error: ${err.message || 'Failed to connect to Tinker'}`)
    process.exit(1)
  }

  if (!res.success) {
    console.error(`Error: ${res.error}`)
    process.exit(1)
  }

  if (res.data !== undefined) {
    if (options?.format) {
      try {
        options.format(res.data)
      } catch (err: any) {
        console.error(`Error: ${err.message || String(err)}`)
        process.exit(1)
      }
    } else {
      console.log(JSON.stringify(res.data, null, 2))
    }
  } else {
    console.log('Done.')
  }

  process.exit(0)
}

const program = new Command()
program
  .name('tinker')
  .description('Tinker desktop toolbox CLI')
  .version(VERSION)

function pluginCommand(name: string, description: string) {
  program
    .command(`${name} <plugin>`)
    .description(description)
    .action((pluginName: string) => {
      executeCommand(name, { id: normalizePluginId(pluginName) })
    })
}

program
  .command('open <plugin>')
  .description('Open a plugin in a detached window')
  .option(
    '--remote-debugging-port <port>',
    'Enable remote debugging on the specified port'
  )
  .action((pluginName: string, opts: { remoteDebuggingPort?: string }) => {
    executeCommand('open', {
      id: normalizePluginId(pluginName),
      remoteDebuggingPort: opts.remoteDebuggingPort,
    })
  })

pluginCommand('close', 'Close a running plugin')
pluginCommand('restart', 'Restart a running plugin (close then open)')

program
  .command('quit')
  .description('Quit the Tinker app')
  .action(() => {
    executeCommand('quit')
  })

program
  .command('list')
  .description('List installed plugins')
  .action(() => {
    executeCommand('list', undefined, { format: formatPluginList })
  })

program
  .command('ps')
  .description('List running plugins with process IDs')
  .action(() => {
    executeCommand('ps', undefined, { format: formatRunningPlugins })
  })

program
  .command('tools <plugin>')
  .description('List MCP tools for a plugin')
  .action((pluginName: string) => {
    executeCommand(
      'getPlugin',
      { id: normalizePluginId(pluginName) },
      {
        format: formatPluginTools,
      }
    )
  })

program
  .command('call <plugin>')
  .description('Call an MCP tool on a running plugin')
  .requiredOption('--tool <name>', 'Tool name to call')
  .option('--args <json>', 'Tool arguments as JSON', '{}')
  .action((pluginName: string, opts: { tool: string; args: string }) => {
    let args: Record<string, unknown>
    try {
      args = JSON.parse(opts.args)
    } catch {
      console.error('Error: Invalid JSON for --args')
      process.exit(1)
    }
    if (args === null || typeof args !== 'object' || Array.isArray(args)) {
      console.error('Error: --args must be a JSON object')
      process.exit(1)
    }
    executeCommand(
      'callMcpTool',
      {
        id: normalizePluginId(pluginName),
        name: opts.tool,
        args,
      },
      { format: formatToolCallResult }
    )
  })

program
  .command('mcp <plugin>')
  .description('Start an MCP server for a plugin (stdio transport)')
  .action(async (pluginName: string) => {
    try {
      await startMcpServer(normalizePluginId(pluginName))
    } catch (err: any) {
      console.error(`Error: ${err.message || 'Failed to start MCP server'}`)
      process.exit(1)
    }
  })

program
  .command('skills [subcommand] [name]')
  .description('List and locate bundled skill content')
  .action((subcommand?: string, name?: string) => {
    const args = subcommand ? (name ? [subcommand, name] : [subcommand]) : []
    runSkills(args)
    process.exit(0)
  })

program.parse(process.argv.slice(2), { from: 'user' })
