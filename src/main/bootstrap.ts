import path from 'path'
import Tracing from 'licia/Tracing'

const tracer = new Tracing({
  processName: 'tinker-main',
  threadName: 'main',
})
tracer.start('startup')
tracer.begin('startup', 'imports')
global.__startupTracer = tracer

// eslint-disable-next-line @typescript-eslint/no-require-imports
require(path.join(__dirname, 'index.js'))
