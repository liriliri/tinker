import { spawn } from 'child_process'
import type { SpawnOptions } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { getUserDataPath, handleEvent } from 'share/main/lib/util'
import { getSettingsStore } from '../store'
import { plugins } from './loader'
import { isDev } from 'share/common/util'

const pluginInstallDir = getUserDataPath('plugins')

function getNpmCliPath() {
  let npmDir = path.dirname(require.resolve('npm/package.json'))
  if (!isDev()) {
    npmDir = npmDir.replace('app.asar', 'app.asar.unpacked')
  }
  return path.join(npmDir, 'bin/npm-cli.js')
}

function runNpm(args: string[], options: SpawnOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [getNpmCliPath(), ...args], {
      ...options,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    })

    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (data) => {
      stdout += data
      process.stdout.write(data)
    })
    child.stderr?.on('data', (data) => {
      stderr += data
      process.stderr.write(data)
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

export function init() {
  handleEvent('installPlugin', installPlugin)
  handleEvent('uninstallPlugin', uninstallPlugin)
  handleEvent('checkPluginUpdate', checkPluginUpdate)
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
