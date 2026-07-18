import { dialog } from 'electron'
import { resolve } from 'path'
import { homedir } from 'os'
import fs from 'fs-extra'
import { t } from 'common/util'
import skillMd from '../../../skills/tinker/SKILL.md?raw'
import { installCli, isCliInstalled } from './shell'

const SKILL_NAME = 'tinker'

function getSkillDir(): string {
  return resolve(homedir(), '.agents', 'skills', SKILL_NAME)
}

export async function isSkillInstalled(): Promise<boolean> {
  return fs.pathExists(getSkillDir())
}

export async function installSkill(): Promise<void> {
  if (!(await isCliInstalled())) {
    await installCli({ silent: true })
  }

  const skillDir = getSkillDir()
  if (await fs.pathExists(skillDir)) {
    return
  }

  await fs.ensureDir(skillDir)
  await fs.writeFile(resolve(skillDir, 'SKILL.md'), skillMd)
  dialog.showMessageBox({ message: t('installAgentSkillSuccess') })
}
