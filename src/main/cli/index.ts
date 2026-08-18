import { Command } from 'commander'
import {
  sendCommand,
  launchTinker,
  isServerRunning,
  waitForServer,
} from './ipc'
import { registerMcpCommands } from './mcp'
import { registerUiCommands } from './ui'
import { registerDataCommands } from './data'
import { runSkills } from './skills'
import { registerListCommand } from './list'
import { normalizePluginId } from './util'

interface ExecuteCommandOptions {
  format?: (data: unknown) => void
  timeout?: number
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

async function executeCommand(
  command: string,
  data?: Record<string, unknown>,
  options?: ExecuteCommandOptions
) {
  let res
  try {
    res = await sendCommand(command, data, { timeout: options?.timeout })
  } catch (err: any) {
    console.error(`Error: ${err.message || 'Failed to connect to Tinker'}`)
    process.exit(1)
  }

  if (!res.success) {
    console.error(`Error: ${res.error}`)
    process.exit(1)
  }

  const inspectUrl = (res.data as { inspectUrl?: string } | undefined)
    ?.inspectUrl
  if (inspectUrl) {
    const ws = inspectUrl.replace(/^ws:\/\//, '')
    console.log(`Debugger listening on ${inspectUrl}`)
    console.log(
      `Open in Chrome: devtools://devtools/bundled/inspector.html?ws=${ws}`
    )
    process.exit(0)
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

function parseInspectOption(value: unknown): string | true | undefined {
  if (value === undefined) return undefined
  if (value === true) return true
  return String(value)
}

function withInspectData(
  data: Record<string, unknown>,
  inspect?: string | true
) {
  const value = parseInspectOption(inspect)
  if (value !== undefined) {
    data.inspect = value
  }
  return data
}

program
  .command('open <plugin>')
  .description('Open a plugin in a detached window')
  .option('--headless', 'Open the plugin in the background without a window')
  .option(
    '--inspect [address]',
    'Enable CDP inspect for the plugin (host:port or port)'
  )
  .action(
    (
      pluginName: string,
      opts: { headless?: boolean; inspect?: string | true }
    ) => {
      executeCommand(
        'open',
        withInspectData(
          {
            id: normalizePluginId(pluginName),
            headless: opts.headless,
          },
          opts.inspect
        )
      )
    }
  )

program
  .command('close <plugin>')
  .description('Close a running plugin')
  .action((pluginName: string) => {
    executeCommand('close', { id: normalizePluginId(pluginName) })
  })

program
  .command('restart <plugin>')
  .description('Restart a running plugin (close then open)')
  .option(
    '--inspect [address]',
    'Enable CDP inspect for the plugin (host:port or port)'
  )
  .action((pluginName: string, opts: { inspect?: string | true }) => {
    executeCommand(
      'restart',
      withInspectData({ id: normalizePluginId(pluginName) }, opts.inspect)
    )
  })

program
  .command('launch')
  .description('Launch the Tinker app')
  .option(
    '--remote-debugging-port <port>',
    'Enable remote debugging on the specified port'
  )
  .option('--http [address]', 'Enable HTTP remote viewer (host:port or port)')
  .option('--http-username <username>', 'HTTP Basic Auth username')
  .option('--http-password <password>', 'HTTP Basic Auth password')
  .action(
    async (opts: {
      remoteDebuggingPort?: string
      http?: string | true
      httpUsername?: string
      httpPassword?: string
    }) => {
      try {
        const httpOpt = parseInspectOption(opts.http)
        if (
          (opts.httpUsername !== undefined ||
            opts.httpPassword !== undefined) &&
          httpOpt === undefined
        ) {
          console.error(
            'Error: --http-username and --http-password require --http'
          )
          process.exit(1)
        }
        if (await isServerRunning()) {
          if (opts.remoteDebuggingPort || httpOpt !== undefined) {
            console.error(
              'Error: Tinker is already running. Quit first to relaunch with launch options: tinker quit'
            )
            process.exit(1)
          }
          console.log('Tinker is already running.')
          process.exit(0)
        }
        launchTinker({
          remoteDebuggingPort: opts.remoteDebuggingPort,
          http: httpOpt,
          httpUsername: opts.httpUsername,
          httpPassword: opts.httpPassword,
        })
        await waitForServer()
        console.log('Done.')
        process.exit(0)
      } catch (err: any) {
        console.error(`Error: ${err.message || 'Failed to launch Tinker'}`)
        process.exit(1)
      }
    }
  )

program
  .command('quit')
  .description('Quit the Tinker app')
  .action(() => {
    executeCommand('quit')
  })

registerListCommand(program, executeCommand)
registerMcpCommands(program, executeCommand)
registerUiCommands(program, executeCommand)
registerDataCommands(program, executeCommand)

program
  .command('ps')
  .description('List running plugins with process IDs')
  .action(() => {
    executeCommand('ps', undefined, { format: formatRunningPlugins })
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
