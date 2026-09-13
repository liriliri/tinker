import fs from 'fs'
import path from 'path'
import stripAnsi from 'licia/stripAnsi'
import { getUserDataPath } from 'share/main/lib/util'

export const logsDir = getUserDataPath('data/logs')

fs.mkdirSync(logsDir, { recursive: true })

const file = fs.createWriteStream(path.join(logsDir, 'main.log'), {
  flags: 'w',
})

function writeToFile(chunk: string | Buffer | Uint8Array) {
  const text =
    typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')
  file.write(stripAnsi(text))
}

function wrap(stream: NodeJS.WriteStream) {
  const original = stream.write.bind(stream)
  stream.write = ((chunk: any, encoding?: any, cb?: any) => {
    try {
      writeToFile(chunk)
    } catch {
      // ignore
    }
    return original(chunk, encoding, cb)
  }) as typeof stream.write
}

wrap(process.stdout)
wrap(process.stderr)
