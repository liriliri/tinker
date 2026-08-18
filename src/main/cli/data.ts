import { Command } from 'commander'
import path from 'path'
import fs from 'fs'
import dateFormat from 'licia/dateFormat'
import { normalizePluginId } from './util'

type ExecuteCommand = (
  command: string,
  data?: Record<string, unknown>,
  options?: { format?: (data: unknown) => void; timeout?: number }
) => void

const DATA_TIMEOUT = 60000

export function registerDataCommands(
  program: Command,
  executeCommand: ExecuteCommand
) {
  const data = program
    .command('data')
    .description('Import, export, or clear plugin local data')

  data
    .command('export <plugin> [file]')
    .description('Export plugin data to a zip file')
    .action((pluginName: string, file?: string) => {
      const id = normalizePluginId(pluginName)
      const filePath = path.resolve(
        file || `${id}-${dateFormat('yyyymmdd')}.zip`
      )
      executeCommand(
        'exportData',
        { id, path: filePath },
        {
          timeout: DATA_TIMEOUT,
          format: (out) => console.log(out),
        }
      )
    })

  data
    .command('import <plugin> <file>')
    .description('Import plugin data from a zip file')
    .action((pluginName: string, file: string) => {
      const filePath = path.resolve(file)
      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`)
        process.exit(1)
      }
      executeCommand(
        'importData',
        { id: normalizePluginId(pluginName), path: filePath },
        { timeout: DATA_TIMEOUT }
      )
    })

  data
    .command('clear <plugin>')
    .description('Clear plugin local data')
    .option('--yes', 'Confirm clearing plugin data')
    .action((pluginName: string, opts: { yes?: boolean }) => {
      if (!opts.yes) {
        console.error('Error: --yes is required to clear plugin data')
        process.exit(1)
      }
      executeCommand(
        'clearData',
        { id: normalizePluginId(pluginName) },
        { timeout: DATA_TIMEOUT }
      )
    })
}
