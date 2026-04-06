import { contextBridge } from 'electron'
import { fork } from 'child_process'

let child: ReturnType<typeof fork> | null = null
let nextId = 0
const pending = new Map<
  number,
  { resolve: (v: string) => void; reject: (e: Error) => void }
>()

function getChild() {
  if (!child) {
    child = fork(
      '-e',
      [
        `
const { createReadStream } = require('fs');
const { createHash } = require('crypto');
const ONE_HUNDRED_KB = 100 * 1024;
process.on('message', ({ id, filePath, fileSize }) => {
  const hash = createHash('md5');
  const end = fileSize > ONE_HUNDRED_KB ? ONE_HUNDRED_KB - 1 : undefined;
  const stream = createReadStream(filePath, { start: 0, end });
  stream.on('data', (chunk) => hash.update(chunk));
  stream.on('end', () => process.send({ id, md5: hash.digest('hex') }));
  stream.on('error', (err) => process.send({ id, error: err.message }));
});
        `,
      ],
      { stdio: 'ignore' }
    )
    child.on('message', (msg: { id: number; md5?: string; error?: string }) => {
      const cb = pending.get(msg.id)
      if (cb) {
        pending.delete(msg.id)
        if (msg.error) {
          cb.reject(new Error(msg.error))
        } else {
          cb.resolve(msg.md5!)
        }
      }
    })
    child.on('exit', () => {
      for (const cb of pending.values()) {
        cb.reject(new Error('MD5 worker exited'))
      }
      pending.clear()
      child = null
    })
  }
  return child
}

const duplicateCleanerObj = {
  calculateMD5(filePath: string, fileSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = nextId++
      pending.set(id, { resolve, reject })
      getChild().send({ id, filePath, fileSize })
    })
  },
}

contextBridge.exposeInMainWorld('duplicateCleaner', duplicateCleanerObj)

declare global {
  const duplicateCleaner: typeof duplicateCleanerObj
}
