import { spawn } from 'child_process'
import type { SpawnOptions } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { getUserDataPath } from 'share/main/lib/util'
import { getSettingsStore } from '../store'
import { plugins } from './loader'

const pluginInstallDir = getUserDataPath('plugins')

function getNpmCliPath() {
  const npmDir = path.dirname(require.resolve('npm/package.json'))
  return path.join(npmDir, 'bin/npm-cli.js')
}

function runNpm(args: string[], options: SpawnOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [getNpmCliPath(), ...args], options)

    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (data) => {
      stdout += data
    })
    child.stderr?.on('data', (data) => {
      stderr += data
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(
          new Error(`npm ${args[0]} failed (code ${code}): ${stderr || stdout}`)
        )
      }
    })

    child.on('error', (err) => reject(err))
  })
}

export async function installPlugin(name: string): Promise<void> {
  await fs.mkdirs(pluginInstallDir)
  const registry = getSettingsStore().get('npmRegistry')
  await runNpm(
    ['install', name, '--prefix', pluginInstallDir, `--registry=${registry}`],
    { cwd: pluginInstallDir }
  )
}

export async function uninstallPlugin(name: string): Promise<void> {
  await runNpm(['uninstall', name, '--prefix', pluginInstallDir], {
    cwd: pluginInstallDir,
  })
}

export async function checkPluginUpdate(id: string): Promise<string | null> {
  const plugin = plugins[id]
  if (!plugin || !plugin.userInstalled || !plugin.version) {
    return null
  }

  const registry = getSettingsStore().get('npmRegistry')
  const output = await runNpm(['view', id, 'version', `--registry=${registry}`])
  const latestVersion = output.trim()
  if (latestVersion && latestVersion !== plugin.version) {
    return latestVersion
  }

  return null
}
