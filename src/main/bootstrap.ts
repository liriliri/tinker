import path from 'path'
import Module from 'module'
import Tracing from 'licia/Tracing'

declare global {
  var __startupTracer: Tracing | undefined
}

const tracer = new Tracing({
  processName: 'tinker-main',
  threadName: 'main',
})
tracer.start('startup')
tracer.begin('startup', 'imports')
global.__startupTracer = tracer

const indexPath = path.join(__dirname, 'index.js')

const ModuleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null | undefined,
    isMain: boolean
  ) => unknown
}
const origLoad = ModuleWithLoad._load

ModuleWithLoad._load = function (request, parent, isMain) {
  // Skip entry: markImportsDone() runs inside it and would pop the wrong frame.
  if (request === indexPath) {
    return origLoad(request, parent, isMain)
  }

  tracer.begin('startup', `require ${request}`)
  try {
    return origLoad(request, parent, isMain)
  } finally {
    tracer.end()
  }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
require(indexPath)
