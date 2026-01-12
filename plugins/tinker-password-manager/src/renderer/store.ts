import { makeAutoObservable, reaction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import * as kdbxweb from 'kdbxweb'
import i18n from './i18n'
import toast from 'react-hot-toast'

const storage = new LocalStore('tinker-password-manager')

export type KdbxEntry = {
  uuid: string
  title: string
  username: string
  password: kdbxweb.ProtectedValue
  url: string
  notes: string
  icon: number
  tags: string[]
  customFields: Map<string, any>
  times: {
    creationTime: Date
    lastModTime: Date
    lastAccessTime: Date
    expiryTime: Date | null
    expires: boolean
  }
}

export type KdbxGroup = {
  uuid: string
  name: string
  icon: number
  entries: KdbxEntry[]
  groups: KdbxGroup[]
}

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
    ].slice(0, 10)
    this.saveRecentFiles()
  }

  // Database operations
  async createDatabase(name: string, password: string) {
    try {
      const credentials = new kdbxweb.Credentials(
        kdbxweb.ProtectedValue.fromString(password)
      )
      this.db = kdbxweb.Kdbx.create(credentials, name)
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
      const fileData = await passwordManager.readFile(path)
      const credentials = new kdbxweb.Credentials(
        kdbxweb.ProtectedValue.fromString(password),
        keyFileData
      )

      this.db = await kdbxweb.Kdbx.load(fileData, credentials)
      this.dbPath = path
      this.dbName = path.split('/').pop() || 'Database'
      this.isLocked = false
      this.isModified = false
      this.addRecentFile(path)
      this.readDatabase()
    } catch (error: any) {
      if (error.code === kdbxweb.Consts.ErrorCodes.InvalidKey) {
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
        await passwordManager.writeFile(this.dbPath, new Uint8Array(data))
        this.isModified = false
      } else {
        // Save as new file
        const result = await tinker.showSaveDialog({
          defaultPath: this.dbName + '.kdbx',
          filters: [{ name: 'KeePass Database', extensions: ['kdbx'] }],
        })

        if (result && !result.canceled && result.filePath) {
          await passwordManager.writeFile(result.filePath, new Uint8Array(data))
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
        await passwordManager.writeFile(result.filePath, new Uint8Array(data))
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
    if (this.isModified) {
      // TODO: Show confirmation dialog
    }
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
    this.rootGroup = this.convertGroup(defaultGroup)
    this.groups = this.flattenGroups(this.rootGroup)

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

  private convertGroup(kdbxGroup: kdbxweb.KdbxGroup): KdbxGroup {
    const group: KdbxGroup = {
      uuid: kdbxGroup.uuid.id,
      name: kdbxGroup.name ?? '',
      icon: kdbxGroup.icon ?? 0,
      entries: [],
      groups: [],
    }

    // Convert entries
    kdbxGroup.entries.forEach((entry) => {
      group.entries.push(this.convertEntry(entry))
    })

    // Convert subgroups
    kdbxGroup.groups.forEach((subGroup) => {
      group.groups.push(this.convertGroup(subGroup))
    })

    return group
  }

  private convertEntry(kdbxEntry: kdbxweb.KdbxEntry): KdbxEntry {
    const getFieldValue = (fieldName: string): string => {
      const value = kdbxEntry.fields.get(fieldName)
      if (!value) return ''
      if (typeof value === 'string') return value
      if (value instanceof kdbxweb.ProtectedValue) {
        return value.getText() || ''
      }
      return String(value)
    }

    const getPasswordValue = (): kdbxweb.ProtectedValue => {
      const value = kdbxEntry.fields.get('Password')
      if (value instanceof kdbxweb.ProtectedValue) {
        return value
      }
      return kdbxweb.ProtectedValue.fromString('')
    }

    return {
      uuid: kdbxEntry.uuid.id,
      title: getFieldValue('Title'),
      username: getFieldValue('UserName'),
      password: getPasswordValue(),
      url: getFieldValue('URL'),
      notes: getFieldValue('Notes'),
      icon: kdbxEntry.icon ?? 0,
      tags: kdbxEntry.tags || [],
      customFields: kdbxEntry.fields,
      times: {
        creationTime: kdbxEntry.times.creationTime ?? new Date(),
        lastModTime: kdbxEntry.times.lastModTime ?? new Date(),
        lastAccessTime: kdbxEntry.times.lastAccessTime ?? new Date(),
        expiryTime: kdbxEntry.times.expiryTime ?? null,
        expires: kdbxEntry.times.expires ?? false,
      },
    }
  }

  private flattenGroups(group: KdbxGroup): KdbxGroup[] {
    const result: KdbxGroup[] = [group]
    group.groups.forEach((subGroup) => {
      result.push(...this.flattenGroups(subGroup))
    })
    return result
  }

  // UI operations
  selectGroup(groupId: string) {
    this.selectedGroupId = groupId
    this.selectedEntryId = null
    this.searchQuery = '' // Clear search when switching groups
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
    // Global search when query exists
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      const allEntries: KdbxEntry[] = []

      // Collect entries from all groups
      this.groups.forEach((group) => {
        allEntries.push(...group.entries)
      })

      // Filter entries
      this.filteredEntries = allEntries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.username.toLowerCase().includes(query) ||
          entry.url.toLowerCase().includes(query) ||
          entry.notes.toLowerCase().includes(query)
      )
      return
    }

    // Show current group entries when no search query
    if (!this.selectedGroupId) {
      this.filteredEntries = []
      return
    }

    const group = this.groups.find((g) => g.uuid === this.selectedGroupId)
    if (!group) {
      this.filteredEntries = []
      return
    }

    this.filteredEntries = group.entries
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword
  }

  // Entry operations
  createEntry(groupId: string, title: string) {
    if (!this.db) return

    const group = this.findKdbxGroup(groupId)
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

    const entry = this.findKdbxEntry(entryId)
    if (!entry) return

    entry.fields.set(field, value)
    entry.times.update()

    this.isModified = true
    this.readDatabase()
  }

  deleteEntry(entryId: string) {
    if (!this.db) return

    const entry = this.findKdbxEntry(entryId)
    if (!entry) return

    this.db.remove(entry)
    this.isModified = true
    this.readDatabase()
    this.selectedEntryId = null
  }

  // Group operations
  createGroup(parentGroupId: string, name: string) {
    if (!this.db) return

    const parentGroup = this.findKdbxGroup(parentGroupId)
    if (!parentGroup) return

    const group = this.db.createGroup(parentGroup, name)
    group.times.update()

    this.isModified = true
    this.readDatabase()
  }

  renameGroup(groupId: string, name: string) {
    if (!this.db) return

    const group = this.findKdbxGroup(groupId)
    if (!group) return

    group.name = name
    group.times.update()

    this.isModified = true
    this.readDatabase()
  }

  deleteGroup(groupId: string) {
    if (!this.db) return

    const group = this.findKdbxGroup(groupId)
    if (!group) return

    this.db.remove(group)
    this.isModified = true
    this.readDatabase()
    this.selectedGroupId = null
  }

  private findKdbxGroup(groupId: string): kdbxweb.KdbxGroup | null {
    if (!this.db) return null

    const findInGroup = (
      group: kdbxweb.KdbxGroup
    ): kdbxweb.KdbxGroup | null => {
      if (group.uuid.id === groupId) return group

      for (const subGroup of group.groups) {
        const found = findInGroup(subGroup)
        if (found) return found
      }

      return null
    }

    return findInGroup(this.db.getDefaultGroup())
  }

  private findKdbxEntry(entryId: string): kdbxweb.KdbxEntry | null {
    if (!this.db) return null

    const findInGroup = (
      group: kdbxweb.KdbxGroup
    ): kdbxweb.KdbxEntry | null => {
      for (const entry of group.entries) {
        if (entry.uuid.id === entryId) return entry
      }

      for (const subGroup of group.groups) {
        const found = findInGroup(subGroup)
        if (found) return found
      }

      return null
    }

    return findInGroup(this.db.getDefaultGroup())
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

const store = new Store()

export default store
