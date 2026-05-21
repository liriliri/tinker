import { app, dialog } from 'electron'
import { resolve } from 'path'
import fs from 'fs-extra'
import isMac from 'licia/isMac'
import isWindows from 'licia/isWindows'
import { t } from 'common/util'
import { exec } from 'share/main/lib/util'

const CLI_NAME = 'tinker'

function getTargetPath(): string {
  return resolve(app.getAppPath(), '..', 'bin', CLI_NAME)
}

function getSymlinkPath(): string {
  return `/usr/local/bin/${CLI_NAME}`
}

export async function isCliInstalled(): Promise<boolean> {
  if (isWindows) {
    try {
      const stdout = await exec(`where ${CLI_NAME}`)
      return stdout.trim().length > 0
    } catch {
      return false
    }
  } else {
    try {
      const stdout = await exec(`which ${CLI_NAME}`)
      return stdout.trim().length > 0
    } catch {
      return false
    }
  }
}

export async function installCli(): Promise<void> {
  if (isMac) {
    const target = getTargetPath()
    if (!(await fs.pathExists(target))) {
      throw new Error(`CLI script not found: ${target}`)
    }
    const symlinkPath = getSymlinkPath()
    const command = `osascript -e "do shell script \\"mkdir -p /usr/local/bin && ln -sf '${target}' '${symlinkPath}'\\" with administrator privileges"`
    await exec(command)
  } else if (isWindows) {
    const binDir = resolve(app.getAppPath(), '..', 'bin')
    const command = `powershell -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';${binDir}', 'User')"`
    await exec(command)
  } else {
    const target = getTargetPath()
    if (!(await fs.pathExists(target))) {
      throw new Error(`CLI script not found: ${target}`)
    }
    const symlinkPath = getSymlinkPath()
    const command = `pkexec sh -c "mkdir -p /usr/local/bin && ln -sf '${target}' '${symlinkPath}'"`
    await exec(command)
  }

  dialog.showMessageBox({ message: t('installCliSuccess') })
}
