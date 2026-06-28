import { contextBridge } from 'electron'
import { readFileSync, statSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import * as path from 'path'
import { Client, type SFTPWrapper } from 'ssh2'
import type {
  IFileEntry,
  ISftpConnectConfig,
  ITransferProgressEvent,
} from '../common/types'
import { SFTP_TRANSFER_PROGRESS_CHANNEL } from '../common/types'

const SKIP_ENTRIES = new Set(['.', '..', '.DS_Store', 'Thumbs.db'])

interface ConnectionState {
  client: Client
  sftp: SFTPWrapper
}

const connections = new Map<string, ConnectionState>()

function emitTransferProgress(event: ITransferProgressEvent) {
  window.postMessage({ channel: SFTP_TRANSFER_PROGRESS_CHANNEL, ...event }, '*')
}

function buildConnectConfig(config: ISftpConnectConfig) {
  const connectConfig: Record<string, unknown> = {
    host: config.host,
    port: config.port,
    username: config.username,
    readyTimeout: 15000,
    keepaliveInterval: 10000,
    keepaliveCountMax: 3,
    tryKeyboard: true,
  }

  if (config.authType === 'password' && config.password) {
    connectConfig.password = config.password
  } else if (config.authType === 'privateKey' && config.privateKey) {
    const keyPath = config.privateKey.replace(/^~/, homedir())
    connectConfig.privateKey = readFileSync(keyPath, 'utf8')
  }

  return connectConfig
}

function normalizeRemotePath(remotePath: string): string {
  if (!remotePath || remotePath === '.') return '.'
  const normalized = remotePath.replace(/\\/g, '/')
  if (normalized === '/') return '/'
  return normalized.replace(/\/+$/, '') || '/'
}

function joinRemotePath(dir: string, name: string): string {
  const base = normalizeRemotePath(dir)
  if (base === '/') return `/${name}`
  if (base === '.') return name
  return `${base}/${name}`
}

function dirnameRemote(remotePath: string): string {
  const normalized = normalizeRemotePath(remotePath)
  if (normalized === '/' || normalized === '.') return normalized
  const index = normalized.lastIndexOf('/')
  if (index <= 0) return '/'
  return normalized.slice(0, index)
}

function sftpCallback<T>(
  fn: (cb: (err: Error | undefined, result: T) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

function getConnection(connectionId: string): ConnectionState {
  const connection = connections.get(connectionId)
  if (!connection) {
    throw new Error('Not connected')
  }
  return connection
}

async function readRemoteDir(
  connectionId: string,
  remotePath: string
): Promise<IFileEntry[]> {
  const { sftp } = getConnection(connectionId)
  const normalizedPath = normalizeRemotePath(remotePath)
  const list = await sftpCallback<
    Array<{
      filename: string
      attrs: { size: number; mtime?: number; isDirectory(): boolean }
    }>
  >((cb) => sftp.readdir(normalizedPath, cb))

  const entries: IFileEntry[] = []

  for (const item of list) {
    if (SKIP_ENTRIES.has(item.filename)) continue

    entries.push({
      name: item.filename,
      path: joinRemotePath(normalizedPath, item.filename),
      isDirectory: item.attrs.isDirectory(),
      size: item.attrs.isDirectory() ? 0 : item.attrs.size,
      mtimeMs: (item.attrs.mtime || 0) * 1000,
    })
  }

  entries.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  return entries
}

interface RemoteStat {
  isDirectory(): boolean
  size: number
}

async function statRemote(
  connectionId: string,
  remotePath: string
): Promise<RemoteStat> {
  const { sftp } = getConnection(connectionId)
  return sftpCallback<RemoteStat>((cb) =>
    sftp.stat(normalizeRemotePath(remotePath), cb)
  )
}

async function calcRemoteSize(
  connectionId: string,
  remotePath: string
): Promise<number> {
  const stat = await statRemote(connectionId, remotePath)
  if (!stat.isDirectory()) return stat.size

  let total = 0
  const entries = await readRemoteDir(connectionId, remotePath)
  for (const entry of entries) {
    if (entry.isDirectory) {
      total += await calcRemoteSize(connectionId, entry.path)
    } else {
      total += entry.size
    }
  }
  return total
}

interface DownloadProgressState {
  transferred: number
  total: number
}

async function downloadRemoteFile(
  connectionId: string,
  remotePath: string,
  localPath: string,
  transferId: string | undefined,
  state: DownloadProgressState
): Promise<void> {
  const { sftp } = getConnection(connectionId)
  mkdirSync(path.dirname(localPath), { recursive: true })

  await sftpCallback<void>((cb) =>
    sftp.fastGet(
      normalizeRemotePath(remotePath),
      localPath,
      {
        step: (transferred) => {
          if (!transferId) return
          emitTransferProgress({
            transferId,
            transferred: state.transferred + transferred,
            total: state.total,
          })
        },
      },
      cb
    )
  )

  const size = statSync(localPath).size
  state.transferred += size
  if (transferId) {
    emitTransferProgress({
      transferId,
      transferred: state.transferred,
      total: state.total,
    })
  }
}

async function deleteRemoteEntry(
  connectionId: string,
  remotePath: string
): Promise<void> {
  const { sftp } = getConnection(connectionId)
  const normalized = normalizeRemotePath(remotePath)
  const stat = await sftpCallback<{ isDirectory(): boolean }>((cb) =>
    sftp.stat(normalized, cb)
  )

  if (stat.isDirectory()) {
    const entries = await readRemoteDir(connectionId, normalized)
    for (const entry of entries) {
      await deleteRemoteEntry(connectionId, entry.path)
    }
    await sftpCallback<void>((cb) => sftp.rmdir(normalized, cb))
  } else {
    await sftpCallback<void>((cb) => sftp.unlink(normalized, cb))
  }
}

async function downloadRemoteDirectory(
  connectionId: string,
  remotePath: string,
  localPath: string,
  transferId: string | undefined,
  state: DownloadProgressState
): Promise<void> {
  mkdirSync(localPath, { recursive: true })
  const entries = await readRemoteDir(connectionId, remotePath)

  for (const entry of entries) {
    const childLocal = path.join(localPath, entry.name)
    if (entry.isDirectory) {
      await downloadRemoteDirectory(
        connectionId,
        entry.path,
        childLocal,
        transferId,
        state
      )
    } else {
      await downloadRemoteFile(
        connectionId,
        entry.path,
        childLocal,
        transferId,
        state
      )
    }
  }
}

const sftpObj = {
  basename(filePath: string): string {
    return path.basename(filePath)
  },

  joinPath(...parts: string[]): string {
    return path.join(...parts)
  },

  dirnameRemote,
  joinRemotePath,
  normalizeRemotePath,

  isConnected(connectionId: string): boolean {
    return connections.has(connectionId)
  },

  async connect(
    connectionId: string,
    config: ISftpConnectConfig
  ): Promise<void> {
    await sftpObj.disconnect(connectionId)

    return new Promise((resolve, reject) => {
      const client = new Client()

      client.on('ready', () => {
        client.sftp((err, sftp) => {
          if (err) {
            client.end()
            reject(err)
            return
          }
          connections.set(connectionId, { client, sftp })
          resolve()
        })
      })

      client.on(
        'keyboard-interactive',
        (_name, _instructions, _lang, prompts, finish) => {
          if (config.authType === 'password' && config.password) {
            finish(prompts.map(() => config.password!))
          } else {
            finish(prompts.map(() => ''))
          }
        }
      )

      client.on('error', (err) => {
        if (!connections.has(connectionId)) {
          reject(err)
        }
      })

      client.connect(
        buildConnectConfig(config) as Parameters<typeof client.connect>[0]
      )
    })
  },

  async disconnect(connectionId: string): Promise<void> {
    const connection = connections.get(connectionId)
    if (!connection) return

    connections.delete(connectionId)

    return new Promise((resolve) => {
      connection.client.on('close', () => resolve())
      connection.sftp.end()
      connection.client.end()
    })
  },

  async resolveRemotePath(
    connectionId: string,
    remotePath?: string
  ): Promise<string> {
    const { sftp } = getConnection(connectionId)
    if (!remotePath || remotePath === '.' || remotePath === '~') {
      return sftpCallback<string>((cb) => sftp.realpath('.', cb))
    }
    return normalizeRemotePath(remotePath)
  },

  readRemoteDir,

  calcRemoteSize,

  async download(
    connectionId: string,
    remotePath: string,
    localPath: string,
    transferId?: string
  ): Promise<void> {
    getConnection(connectionId)
    const normalized = normalizeRemotePath(remotePath)
    const stat = await statRemote(connectionId, normalized)
    const total = stat.isDirectory()
      ? await calcRemoteSize(connectionId, normalized)
      : stat.size
    const state: DownloadProgressState = { transferred: 0, total }

    if (transferId && total > 0) {
      emitTransferProgress({ transferId, transferred: 0, total })
    }

    if (stat.isDirectory()) {
      await downloadRemoteDirectory(
        connectionId,
        normalized,
        localPath,
        transferId,
        state
      )
      return
    }

    await downloadRemoteFile(
      connectionId,
      normalized,
      localPath,
      transferId,
      state
    )
  },

  async upload(
    connectionId: string,
    localPath: string,
    remotePath: string,
    transferId?: string
  ): Promise<void> {
    const { sftp } = getConnection(connectionId)
    let total = 0
    try {
      total = statSync(localPath).size
    } catch {
      total = 0
    }

    if (transferId && total > 0) {
      emitTransferProgress({ transferId, transferred: 0, total })
    }

    await sftpCallback<void>((cb) =>
      sftp.fastPut(
        localPath,
        normalizeRemotePath(remotePath),
        {
          step: (transferred, _chunk, stepTotal) => {
            if (!transferId) return
            emitTransferProgress({
              transferId,
              transferred,
              total: stepTotal || total,
            })
          },
        },
        cb
      )
    )
  },

  async deleteRemote(connectionId: string, remotePath: string): Promise<void> {
    await deleteRemoteEntry(connectionId, remotePath)
  },

  async mkdirRemote(connectionId: string, remotePath: string): Promise<void> {
    const { sftp } = getConnection(connectionId)
    await sftpCallback<void>((cb) =>
      sftp.mkdir(normalizeRemotePath(remotePath), cb)
    )
  },

  async renameRemote(
    connectionId: string,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    const { sftp } = getConnection(connectionId)
    await sftpCallback<void>((cb) =>
      sftp.rename(
        normalizeRemotePath(oldPath),
        normalizeRemotePath(newPath),
        cb
      )
    )
  },
}

contextBridge.exposeInMainWorld('sftp', sftpObj)

declare global {
  const sftp: typeof sftpObj
}
