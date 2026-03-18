import { makeAutoObservable, runInAction } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import lowerCase from 'licia/lowerCase'
import uniqId from 'licia/uniqId'
import BaseStore from 'share/BaseStore'
import type { Account } from './types'
import { generateTOTP } from './lib/totp'
import {
  hashPassword,
  verifyPassword,
  encryptText,
  decryptText,
} from './lib/crypto'

const storage = new LocalStore('tinker-authenticator')

class Store extends BaseStore {
  accounts: Account[] = []
  codes: Map<string, string> = new Map()
  currentTime: number = Date.now()
  searchQuery: string = ''
  showAddDialog: boolean = false
  showImportDialog: boolean = false
  showPasswordDialog: boolean = false
  showQRDialog: boolean = false
  qrAccount: Account | null = null
  editingAccount: Account | null = null
  prefillData: Omit<Account, 'id'> | null = null

  /** Whether a master password has been set */
  hasPassword: boolean = false
  /** Whether the vault is currently locked */
  isLocked: boolean = false
  /** In-memory session password (never persisted) */
  private sessionPassword: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    const passwordHash = storage.get('passwordHash') as string | undefined
    runInAction(() => {
      this.hasPassword = !!passwordHash
      this.isLocked = !!passwordHash
    })
    if (!passwordHash) {
      this.loadAccounts()
      this.refreshCodes()
    }
    this.startTimer()
  }

  /** Unique periods across all accounts — used by the timer to detect boundary crossings */
  get uniquePeriods(): number[] {
    return [...new Set(this.accounts.map((a) => a.period))]
  }

  /** Load accounts - decrypts secrets if a session password is set */
  private async loadAccounts() {
    const stored = storage.get('accounts') as Account[] | undefined
    if (!stored || !Array.isArray(stored)) return

    if (this.sessionPassword) {
      const decrypted = await Promise.all(
        stored.map(async (acc) => {
          const secret = await decryptText(acc.secret, this.sessionPassword)
          return { ...acc, secret: secret ?? '' }
        })
      )
      runInAction(() => {
        this.accounts = decrypted
      })
    } else {
      runInAction(() => {
        this.accounts = stored
      })
    }
  }

  /** Save accounts - encrypts secrets if a session password is set */
  private async saveAccounts() {
    if (this.sessionPassword) {
      const encrypted = await Promise.all(
        this.accounts.map(async (acc) => {
          const secret = await encryptText(acc.secret, this.sessionPassword)
          return { ...acc, secret }
        })
      )
      storage.set('accounts', encrypted)
    } else {
      storage.set('accounts', this.accounts)
    }
  }

  private startTimer() {
    window.setInterval(() => {
      const prev = this.currentTime
      runInAction(() => {
        this.currentTime = Date.now()
      })
      if (this.isLocked) return
      const crossed = this.uniquePeriods.some(
        (p) =>
          Math.floor(prev / 1000 / p) !==
          Math.floor(this.currentTime / 1000 / p)
      )
      if (crossed) {
        this.refreshCodes()
      }
    }, 1000)
  }

  async refreshCodes() {
    await Promise.all(this.accounts.map((account) => this.refreshCode(account)))
  }

  get filteredAccounts(): Account[] {
    if (isStrBlank(this.searchQuery)) return this.accounts
    const q = lowerCase(this.searchQuery)
    return this.accounts.filter(
      (a) => lowerCase(a.issuer).includes(q) || lowerCase(a.account).includes(q)
    )
  }

  remainingSeconds(period: number): number {
    const elapsed = Math.floor(this.currentTime / 1000) % period
    return period - elapsed
  }

  timeProgress(period: number): number {
    const elapsed = Math.floor(this.currentTime / 1000) % period
    return (elapsed / period) * 100
  }

  setSearchQuery(value: string) {
    this.searchQuery = value
  }

  openAddDialog(account?: Account) {
    this.editingAccount = account ?? null
    this.prefillData = null
    this.showAddDialog = true
  }

  openAddDialogWithPrefill(data: Omit<Account, 'id'>) {
    this.editingAccount = null
    this.prefillData = data
    this.showAddDialog = true
  }

  closeAddDialog() {
    this.showAddDialog = false
    this.editingAccount = null
    this.prefillData = null
  }

  openImportDialog() {
    this.showImportDialog = true
  }

  closeImportDialog() {
    this.showImportDialog = false
  }

  openQRDialog(account: Account) {
    this.qrAccount = account
    this.showQRDialog = true
  }

  closeQRDialog() {
    this.showQRDialog = false
    this.qrAccount = null
  }

  openPasswordDialog() {
    this.showPasswordDialog = true
  }

  closePasswordDialog() {
    this.showPasswordDialog = false
  }

  async refreshCode(account: Account) {
    try {
      const code = await generateTOTP(
        account.secret,
        account.algorithm,
        account.period,
        account.digits
      )
      runInAction(() => {
        this.codes.set(account.id, code)
      })
    } catch {
      runInAction(() => {
        this.codes.set(account.id, '------')
      })
    }
  }

  addAccount(data: Omit<Account, 'id'>) {
    const account: Account = { ...data, id: uniqId('account_') }
    this.accounts.unshift(account)
    this.saveAccounts()
    this.refreshCode(account)
  }

  updateAccount(id: string, data: Omit<Account, 'id'>) {
    const idx = this.accounts.findIndex((a) => a.id === id)
    if (idx !== -1) {
      this.accounts[idx] = { ...data, id }
      this.saveAccounts()
      this.refreshCode(this.accounts[idx])
    }
  }

  deleteAccount(id: string) {
    this.accounts = this.accounts.filter((a) => a.id !== id)
    this.codes.delete(id)
    this.saveAccounts()
  }

  getCode(id: string): string {
    return this.codes.get(id) ?? '------'
  }

  // ─── Password Protection ─────────────────────────────────────────────────

  /**
   * Attempt to unlock the vault with the given password.
   * Returns true on success, false on wrong password.
   */
  async unlock(password: string): Promise<boolean> {
    const hash = storage.get('passwordHash') as string | undefined
    if (!hash) return true

    const ok = await verifyPassword(password, hash)
    if (!ok) return false

    runInAction(() => {
      this.sessionPassword = password
      this.isLocked = false
    })
    await this.loadAccounts()
    await this.refreshCodes()
    return true
  }

  /** Lock the vault and clear in-memory data */
  lock() {
    this.isLocked = true
    this.sessionPassword = ''
    this.accounts = []
    this.codes.clear()
  }

  /**
   * Set a new master password.
   * Re-encrypts all existing account secrets with the new password.
   */
  async setPassword(password: string): Promise<void> {
    const [encrypted, hash] = await Promise.all([
      Promise.all(
        this.accounts.map(async (acc) => {
          const secret = await encryptText(acc.secret, password)
          return { ...acc, secret }
        })
      ),
      hashPassword(password),
    ])
    storage.set('accounts', encrypted)
    storage.set('passwordHash', hash)
    runInAction(() => {
      this.sessionPassword = password
      this.hasPassword = true
    })
  }

  /**
   * Change the master password.
   * Verifies the old password first, then re-encrypts with the new one.
   * Returns false if old password is wrong.
   */
  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const hash = storage.get('passwordHash') as string | undefined
    if (!hash) return false

    const ok = await verifyPassword(oldPassword, hash)
    if (!ok) return false

    await this.setPassword(newPassword)
    return true
  }

  /**
   * Remove the master password.
   * Decrypts all account secrets, verifies the password first.
   * Returns false if password is wrong.
   */
  async removePassword(password: string): Promise<boolean> {
    const hash = storage.get('passwordHash') as string | undefined
    if (!hash) return true

    const ok = await verifyPassword(password, hash)
    if (!ok) return false

    storage.set('accounts', this.accounts)
    storage.remove('passwordHash')
    runInAction(() => {
      this.sessionPassword = ''
      this.hasPassword = false
    })
    return true
  }
}

export default new Store()
