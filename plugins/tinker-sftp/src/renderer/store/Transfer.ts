import { makeAutoObservable } from 'mobx'
import type { TransferStatus, TransferType } from '../../common/types'

class Transfer {
  id: string
  tabId: string
  type: TransferType
  fileName: string
  sourcePath: string
  destPath: string
  status: TransferStatus = 'pending'
  transferred = 0
  total = 0
  error = ''

  constructor(
    id: string,
    tabId: string,
    type: TransferType,
    fileName: string,
    sourcePath: string,
    destPath: string
  ) {
    this.id = id
    this.tabId = tabId
    this.type = type
    this.fileName = fileName
    this.sourcePath = sourcePath
    this.destPath = destPath
    makeAutoObservable(this)
  }

  get progress(): number {
    if (this.total <= 0) return 0
    return Math.min(100, Math.round((this.transferred / this.total) * 100))
  }

  get isActive(): boolean {
    return this.status === 'pending' || this.status === 'running'
  }
}

export default Transfer
