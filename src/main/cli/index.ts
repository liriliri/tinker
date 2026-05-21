import { spawn } from 'child_process'
import path from 'path'
import { Command } from 'commander'
import { sendCommand, waitForServer, IpcResponse } from './ipc'
import { isDev } from 'share/common/util'

function getElectronPath(): string {
  if (isDev()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('electron') as unknown as string
  }
  return process.execPath
}

function launchElectron(args: string[]) {
  if (isDev()) {
    args.unshift(path.resolve(__dirname, 'index.js'))
  }

  const env = { ...process.env }
  delete env['ELECTRON_RUN_AS_NODE']

  const electronPath = getElectronPath()
  const child = spawn(electronPath, args, {
    detached: true,
    stdio: 'ignore',
    cwd: path.resolve(__dirname, '../..'),
    env,
  })
  child.unref()
}

function normalizePluginId(name: string) {
  return name.startsWith('tinker-') ? name : `tinker-${name}`
}

async function executeCommand(
  command: string,
  data?: Record<string, unknown>
): Promise<void> {
  let res: IpcResponse
  try {
    res = await sendCommand(command, data)
  } catch {
    try {
      launchElectron([])
      await waitForServer()
      res = await sendCommand(command, data)
    } catch (err: any) {
      console.error(`Error: ${err.message || 'Failed to connect to Tinker'}`)
      process.exit(1)
    }
  }

  if (res.success) {
    if (res.data !== undefined) {
      printData(command, res.data)
    } else {
      console.log(`Done.`)
    }
  } else {
    console.error(`Error: ${res.error}`)
    process.exit(1)
  }
}

function printData(command: string, data: unknown) {
  switch (command) {
    case 'list': {
      const plugins = data as Array<{
        id: string
        name: string
        version?: string
        builtin: boolean
      }>
      if (plugins.length === 0) {
        console.log('No plugins installed.')
        return
      }
      for (const p of plugins) {
        const version = !p.builtin && p.version ? ` (${p.version})` : ''
        const tag = p.builtin ? ' [builtin]' : ''
        console.log(`  ${p.id}${version}${tag}`)
      }
      break
    }
    default:
      console.log(JSON.stringify(data, null, 2))
  }
}

const program = new Command()
program
  .name('tinker')
  .description('Tinker desktop toolbox CLI')
  .version(VERSION)

program
  .command('open <plugin>')
  .description('Open a plugin in a detached window')
  .action((pluginName: string) => {
    executeCommand('open', { id: normalizePluginId(pluginName) })
  })

program
  .command('close <plugin>')
  .description('Close a running plugin')
  .action((pluginName: string) => {
    executeCommand('close', { id: normalizePluginId(pluginName) })
  })

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
    executeCommand('list')
  })

program.parse(process.argv.slice(2), { from: 'user' })
