import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { getUserDataPath } from 'share/main/lib/util'

const pluginInstallDir = getUserDataPath('plugins')

function getNpmCliPath() {
  const npmDir = path.dirname(require.resolve('npm/package.json'))
  return path.join(npmDir, 'bin/npm-cli.js')
}

export async function installPlugin(name: string): Promise<void> {
  await fs.mkdirs(pluginInstallDir)

  return new Promise((resolve, reject) => {
    const args = [
      getNpmCliPath(),
      'install',
      name,
      '--prefix',
      pluginInstallDir,
      '--registry=https://registry.npmmirror.com',
    ]
    const child = spawn(process.execPath, args, {
      cwd: pluginInstallDir,
    })

    let output = ''
    child.stdout?.on('data', (data) => {
      output += data
    })
    child.stderr?.on('data', (data) => {
      output += data
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed (code ${code}): ${output}`))
      }
    })

    child.on('error', (err) => reject(err))
  })
}

export async function uninstallPlugin(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      getNpmCliPath(),
      'uninstall',
      name,
      '--prefix',
      pluginInstallDir,
    ]
    const child = spawn(process.execPath, args, {
      cwd: pluginInstallDir,
    })

    let output = ''
    child.stdout?.on('data', (data) => {
      output += data
    })
    child.stderr?.on('data', (data) => {
      output += data
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm uninstall failed (code ${code}): ${output}`))
      }
    })

    child.on('error', (err) => reject(err))
  })
}
