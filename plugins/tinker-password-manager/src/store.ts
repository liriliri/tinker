import { makeAutoObservable, reaction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import * as kdbxweb from 'kdbxweb'
import i18n from './i18n'
import toast from 'react-hot-toast'
import {
  convertGroup,
  flattenGroups,
  findKdbxGroup,
  findKdbxEntry,
} from './lib/kdbx'
import { KdbxEntry, KdbxGroup } from './types'

export type { KdbxEntry, KdbxGroup }

const storage = new LocalStore('tinker-password-manager')

class Store extends BaseStore {
  // Database state
  db: kdbxweb.Kdbx | null = null
  dbPath: string = ''
  dbName: string = ''
  isLocked: boolean = true
  isModified: boolean = false

  // UI state
  selectedGroupId: string | null = null
  selectedEntryId: string | null = null
  searchQuery: string = ''
  showPassword: boolean = false

  // Groups and entries
  rootGroup: KdbxGroup | null = null
  groups: KdbxGroup[] = []
  filteredEntries: KdbxEntry[] = []

  // Recent files
  recentFiles: string[] = []

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadRecentFiles()
    this.bindEvent()
  }

  private bindEvent() {
    // Automatically update title when dbName changes
    reaction(
      () => this.dbName,
      (dbName) => {
        tinker.setTitle(dbName || '')
      }
    )
  }

  private loadRecentFiles() {
    const recent = storage.get('recent-files')
    if (recent) {
      this.recentFiles = recent
    }
  }

  private saveRecentFiles() {
    storage.set('recent-files', this.recentFiles)
  }

  addRecentFile(path: string) {
    this.recentFiles = [
      path,
      ...this.recentFiles.filter((p) => p !== path),
    ].slice(0, 5)
    this.saveRecentFiles()
  }

  removeRecentFile(path: string) {
    this.recentFiles = this.recentFiles.filter((p) => p !== path)
    this.saveRecentFiles()
  }

  // Database operations
  async createDatabase(name: string, password: string) {
    try {
      const credentials = new kdbxweb.Credentials(
        kdbxweb.ProtectedValue.fromString(password)
      )
      this.db = kdbxweb.Kdbx.create(credentials, name)

      // Use AES-KDF instead of Argon2 to avoid "argon2 not implemented" error
      this.db.header.setKdf(kdbxweb.Consts.KdfId.Aes)

      this.dbName = name
      this.isLocked = false
      this.isModified = true
      this.readDatabase()
    } catch (error) {
      toast.error(i18n.t('failedToCreateDatabase'))
      console.error('Failed to create database:', error)
    }
  }

  async openDatabase(
    path: string,
    password: string,
    keyFileData?: ArrayBuffer
  ) {
    try {
      const fileData = await tinker.readFile(path)
      const buffer =
        fileData instanceof ArrayBuffer
          ? fileData
          : fileData.buffer.slice(
              fileData.byteOffset,
              fileData.byteOffset + fileData.byteLength
            )
      const credentials = new kdbxweb.Credentials(
        kdbxweb.ProtectedValue.fromString(password),
        keyFileData
      )

      this.db = await kdbxweb.Kdbx.load(buffer, credentials)
      this.dbPath = path
      this.dbName = path.split('/').pop() || 'Database'
      this.isLocked = false
      this.isModified = false
      this.addRecentFile(path)
      this.readDatabase()
    } catch (error: unknown) {
      if (
        (error as { code?: string }).code ===
        kdbxweb.Consts.ErrorCodes.InvalidKey
      ) {
        toast.error(i18n.t('invalidPassword'))
      } else {
        toast.error(i18n.t('failedToOpenDatabase'))
        console.error('Failed to open database:', error)
      }
    }
  }

  async saveDatabase() {
    if (!this.db) return

    try {
      this.db.cleanup({
        historyRules: true,
        customIcons: true,
        binaries: true,
      })

      const data = await this.db.save()

      if (this.dbPath) {
        await tinker.writeFile(this.dbPath, new Uint8Array(data))
        this.isModified = false
      } else {
        // Save as new file
        const result = await tinker.showSaveDialog({
          defaultPath: this.dbName + '.kdbx',
          filters: [{ name: 'KeePass Database', extensions: ['kdbx'] }],
        })

        if (result && !result.canceled && result.filePath) {
          await tinker.writeFile(result.filePath, new Uint8Array(data))
          this.dbPath = result.filePath
          this.dbName = result.filePath.split('/').pop() || 'Database'
          this.isModified = false
          this.addRecentFile(result.filePath)
        }
      }
    } catch (error) {
      toast.error(i18n.t('failedToSaveDatabase'))
      console.error('Failed to save database:', error)
    }
  }

  async saveAsDatabase() {
    if (!this.db) return

    try {
      const result = await tinker.showSaveDialog({
        defaultPath: this.dbName + '.kdbx',
        filters: [{ name: 'KeePass Database', extensions: ['kdbx'] }],
      })

      if (result && !result.canceled && result.filePath) {
        this.db.cleanup({
          historyRules: true,
          customIcons: true,
          binaries: true,
        })

        const data = await this.db.save()
        await tinker.writeFile(result.filePath, new Uint8Array(data))
        this.dbPath = result.filePath
        this.dbName = result.filePath.split('/').pop() || 'Database'
        this.isModified = false
        this.addRecentFile(result.filePath)
      }
    } catch (error) {
      toast.error(i18n.t('failedToSaveDatabase'))
      console.error('Failed to save database:', error)
    }
  }

  lockDatabase() {
    this.db = null
    this.isLocked = true
    this.rootGroup = null
    this.groups = []
    this.filteredEntries = []
    this.selectedGroupId = null
    this.selectedEntryId = null
  }

  closeDatabase() {
    this.db = null
    this.dbPath = ''
    this.dbName = ''
    this.isLocked = true
    this.isModified = false
    this.rootGroup = null
    this.groups = []
    this.filteredEntries = []
    this.selectedGroupId = null
    this.selectedEntryId = null
  }

  private readDatabase() {
    if (!this.db) return

    // Save current selection
    const currentGroupId = this.selectedGroupId
    const currentEntryId = this.selectedEntryId

    const defaultGroup = this.db.getDefaultGroup()
    this.rootGroup = convertGroup(defaultGroup)
    this.groups = flattenGroups(this.rootGroup)

    // Restore selection
    if (currentGroupId) {
      this.selectGroup(currentGroupId)
      if (currentEntryId) {
        this.selectedEntryId = currentEntryId
      }
    } else if (this.groups.length > 0) {
      this.selectGroup(this.groups[0].uuid)
    }
  }

  // UI operations
  selectGroup(groupId: string) {
    this.selectedGroupId = groupId
    this.selectedEntryId = null
    this.searchQuery = ''
    this.updateFilteredEntries()
  }

  selectEntry(entryId: string) {
    this.selectedEntryId = entryId
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
    if (query && this.groups.length > 0) {
      // Select root group when searching
      this.selectedGroupId = this.groups[0].uuid
      this.selectedEntryId = null
    }
    this.updateFilteredEntries()
  }

  private updateFilteredEntries() {
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      const allEntries: KdbxEntry[] = []

      this.groups.forEach((group) => {
        allEntries.push(...group.entries)
      })

      this.filteredEntries = allEntries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.username.toLowerCase().includes(query) ||
          entry.url.toLowerCase().includes(query) ||
          entry.notes.toLowerCase().includes(query)
      )
      return
    }

    if (!this.selectedGroupId) {
      this.filteredEntries = []
      return
    }

    const group = this.groups.find((g) => g.uuid === this.selectedGroupId)
    this.filteredEntries = group ? group.entries : []
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword
  }

  // Entry operations
  createEntry(groupId: string, title: string) {
    if (!this.db) return

    const group = findKdbxGroup(this.db, groupId)
    if (!group) return

    const entry = this.db.createEntry(group)
    entry.fields.set('Title', title)
    entry.times.update()

    this.isModified = true
    this.readDatabase()
    this.selectEntry(entry.uuid.id)
  }

  updateEntry(
    entryId: string,
    field: string,
    value: string | kdbxweb.ProtectedValue
  ) {
    if (!this.db) return

    const entry = findKdbxEntry(this.db, entryId)
    if (!entry) return

    entry.fields.set(field, value)
    entry.times.update()

    this.isModified = true
    this.readDatabase()
  }

  deleteEntry(entryId: string) {
    if (!this.db) return

    const entry = findKdbxEntry(this.db, entryId)
    if (!entry) return

    this.db.remove(entry)
    this.isModified = true
    this.readDatabase()
    this.selectedEntryId = null
  }

  // Group operations
  createGroup(parentGroupId: string, name: string) {
    if (!this.db) return

    const parentGroup = findKdbxGroup(this.db, parentGroupId)
    if (!parentGroup) return

    const group = this.db.createGroup(parentGroup, name)
    group.times.update()

    this.isModified = true
    this.readDatabase()
  }

  renameGroup(groupId: string, name: string) {
    if (!this.db) return

    const group = findKdbxGroup(this.db, groupId)
    if (!group) return

    group.name = name
    group.times.update()

    this.isModified = true
    this.readDatabase()
  }

  deleteGroup(groupId: string) {
    if (!this.db) return

    const group = findKdbxGroup(this.db, groupId)
    if (!group) return

    this.db.remove(group)
    this.isModified = true
    this.readDatabase()
    this.selectedGroupId = null
  }

  get selectedEntry(): KdbxEntry | null {
    if (!this.selectedEntryId) return null
    return (
      this.filteredEntries.find(
        (entry) => entry.uuid === this.selectedEntryId
      ) || null
    )
  }

  get selectedGroup(): KdbxGroup | null {
    if (!this.selectedGroupId) return null
    return (
      this.groups.find((group) => group.uuid === this.selectedGroupId) || null
    )
  }
}

export default new Store()
