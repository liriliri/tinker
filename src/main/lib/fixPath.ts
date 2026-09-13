import { shellPath } from 'shell-path'
import isWindows from 'licia/isWindows'
import stripAnsi from 'licia/stripAnsi'
import log from 'share/common/log'
import { exec as execCommand } from 'share/main/lib/util'

const logger = log('fixPath')

let fixing: Promise<void> | null = null

export function startFixPath() {
  if (!fixing) {
    fixing = fixPath()
  }
  return fixing
}

export async function exec(command: string) {
  await startFixPath()
  return execCommand(command)
}

async function fixPath() {
  if (isWindows) {
    return
  }

  try {
    const p = await shellPath()
    process.env.PATH =
      (p ? stripAnsi(p) : undefined) ||
      [
        './node_modules/.bin',
        '/.nodebrew/current/bin',
        '/usr/local/bin',
        process.env.PATH,
      ].join(':')
  } catch (err) {
    logger.warn('fixPath failed', err)
  }
}
