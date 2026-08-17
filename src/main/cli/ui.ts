import { Command } from 'commander'
import { normalizePluginId } from './util'

// Keep in sync with command keys in src/main/lib/plugin/ui.ts (CLI must not
// import that module — it pulls Electron APIs incompatible with ELECTRON_RUN_AS_NODE).
const UI_ACTION_HELP =
  'snapshot | click | fill | type | press | find | eval | screenshot | …'

type ExecuteCommand = (
  command: string,
  data?: Record<string, unknown>,
  options?: { format?: (data: unknown) => void; timeout?: number }
) => void

function formatUiResult(data: unknown) {
  console.log(typeof data === 'string' ? data : String(data))
}

function parseUiArgv(tokens: string[]): {
  args: string[]
  options: Record<string, unknown>
} {
  const args: string[] = []
  const options: Record<string, unknown> = {}
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token.startsWith('--')) {
      args.push(token)
      continue
    }
    const body = token.slice(2)
    const eq = body.indexOf('=')
    if (eq !== -1) {
      options[body.slice(0, eq)] = body.slice(eq + 1)
      continue
    }
    const next = tokens[i + 1]
    if (next && !next.startsWith('--')) {
      options[body] = next
      i += 1
    } else {
      options[body] = true
    }
  }
  return { args, options }
}

export function registerUiCommands(
  program: Command,
  executeCommand: ExecuteCommand
) {
  program
    .command('ui')
    .description(
      'Automate a running plugin UI via Playwright agent tools (playwright-cli compatible)'
    )
    .argument('<plugin>', 'Plugin id or short name')
    .argument('<action>', `Playwright-cli action (${UI_ACTION_HELP})`)
    .argument('[tokens...]', 'Action arguments and --flags')
    .allowUnknownOption()
    .action((pluginName: string, action: string, tokens: string[] = []) => {
      const { args, options } = parseUiArgv(tokens)
      executeCommand(
        'ui',
        {
          id: normalizePluginId(pluginName),
          action,
          args,
          options,
        },
        { format: formatUiResult, timeout: 60000 }
      )
    })
}
