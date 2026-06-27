export type SftpAuthType = 'password' | 'privateKey'

export interface ISftpSessionConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: SftpAuthType
  password?: string
  privateKey?: string
}

export interface ISftpConnectConfig {
  host: string
  port: number
  username: string
  authType: SftpAuthType
  password?: string
  privateKey?: string
}

export interface IFileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtimeMs: number
}

export type SortMethod = 'name' | 'size' | 'mtime'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'list' | 'grid'

export type TransferType = 'upload' | 'download'
export type TransferStatus = 'pending' | 'running' | 'completed' | 'failed'

export const SFTP_TRANSFER_PROGRESS_CHANNEL = 'tinker-sftp-transfer-progress'

export interface ITransferProgressEvent {
  transferId: string
  transferred: number
  total: number
}
