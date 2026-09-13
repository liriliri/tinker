/* eslint-disable @typescript-eslint/no-require-imports */
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

if (!app.isPackaged) {
  app.setPath('userData', path.resolve(app.getPath('appData'), PRODUCT_NAME))
}

if (import.meta.env.MODE === 'production') {
  const cacheRoot = path.join(app.getPath('userData'), 'data/cache/require')
  const cacheDir = path.join(cacheRoot, VERSION)
  require('licia/cacheRequire')({ dir: cacheDir })

  setTimeout(async () => {
    try {
      const names = await fs.promises.readdir(cacheRoot)
      await Promise.all(
        names
          .filter((name) => name !== VERSION)
          .map((name) =>
            fs.promises.rm(path.join(cacheRoot, name), {
              recursive: true,
              force: true,
            })
          )
      )
    } catch {
      // ignore
    }
  }, 30000)
}

const Tracing = require('licia/Tracing')
const tracer = new Tracing({
  processName: 'tinker-main',
  threadName: 'main',
})
tracer.start('startup')
tracer.begin('startup', 'imports')
global.__startupTracer = tracer

require(path.join(__dirname, 'index.js'))
