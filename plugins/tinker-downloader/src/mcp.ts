import isStrBlank from 'licia/isStrBlank'
import isUrl from 'licia/isUrl'
import trim from 'licia/trim'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { getFileName } from './lib/url'
import type { Store } from './store'
import pkg from '../package.json'

interface AddArgs {
  url: string
  fileName?: string
  saveDir?: string
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    add,
  })
}

function serializeTask(task: tinker.DownloadTask) {
  return {
    id: task.id,
    url: task.url,
    savePath: task.savePath,
    state: task.state,
    paused: task.paused,
    receivedBytes: task.receivedBytes,
    totalBytes: task.totalBytes,
    speed: task.speed,
  }
}

function add(store: Store, args: AddArgs) {
  const url = trim(args.url)
  if (!isUrl(url)) {
    throw new Error('url must be a valid URL.')
  }

  const fileName = trim(args.fileName || getFileName(url))
  if (isStrBlank(fileName)) {
    throw new Error(
      'fileName is required when it cannot be inferred from the URL.'
    )
  }

  const saveDir = trim(args.saveDir || store.saveDir)
  if (isStrBlank(saveDir)) {
    throw new Error(
      'saveDir is required when no download directory is set in the UI.'
    )
  }

  const savePath = store.buildSavePath(fileName, saveDir)
  const task = store.startDownload(url, savePath)
  store.setFilterTab('downloading')

  return serializeTask(task)
}
