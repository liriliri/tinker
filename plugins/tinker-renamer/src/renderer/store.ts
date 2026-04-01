import { makeAutoObservable, computed, toJS } from 'mobx'
import BaseStore from 'share/BaseStore'
import uuid from 'licia/uuid'
import LocalStore from 'licia/LocalStore'
import type { Rule, RuleType, FileInfo, RenameOperation } from '../common/types'
import type { FileRow, RuleRow } from './types'
import { execRules } from './lib/rules'
import { parseFile, ruleDescription } from './lib/util'

const storage = new LocalStore('tinker-renamer')
const RULES_KEY = 'rules'

class Store extends BaseStore {
  files: string[] = []
  rules: Rule[] = []
  selectedFile: string | null = null
  selectedRule: string | null = null
  renaming = false
  dialogOpen = false
  editingRule: Rule | null = null

  constructor() {
    super()
    makeAutoObservable(this, {
      previews: computed,
    })
    this.loadRules()
  }

  private loadRules() {
    const saved = storage.get(RULES_KEY)
    if (Array.isArray(saved)) {
      this.rules = saved
    }
  }

  private saveRules() {
    storage.set(RULES_KEY, toJS(this.rules))
  }

  get fileInfos(): FileInfo[] {
    return this.files.map(parseFile)
  }

  get previews(): { original: string; newName: string; changed: boolean }[] {
    const enabledRules = this.rules.filter((r) => r.enabled)
    return this.fileInfos.map((f, idx) => {
      const newName =
        enabledRules.length > 0
          ? execRules(enabledRules, f.name, f.ext, idx + 1)
          : f.fullName
      return {
        original: f.fullName,
        newName,
        changed: f.fullName !== newName,
      }
    })
  }

  get hasChanges(): boolean {
    return this.previews.some((p) => p.changed)
  }

  get rowData(): FileRow[] {
    return this.previews.map((p, idx) => ({
      fullPath: this.files[idx],
      index: idx + 1,
      original: p.original,
      newName: p.newName,
      changed: p.changed,
    }))
  }

  ruleRowData(t: (key: string) => string): RuleRow[] {
    return this.rules.map((rule, idx) => ({
      id: rule.id,
      index: idx + 1,
      type: rule.type,
      description: ruleDescription(rule, t),
      enabled: rule.enabled,
      rule,
    }))
  }

  async addFiles() {
    const result = await tinker.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
    })
    if (result.canceled || result.filePaths.length === 0) return
    this.addFilePaths(result.filePaths)
  }

  async addDir() {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return

    const dirPath = result.filePaths[0]
    const filePaths = await renamer.readDir(dirPath)
    this.addFilePaths(filePaths)
  }

  private addFilePaths(paths: string[]) {
    const existing = new Set(this.files)
    for (const p of paths) {
      if (!existing.has(p)) {
        this.files.push(p)
        existing.add(p)
      }
    }
  }

  selectFile(fullPath: string) {
    this.selectedFile = fullPath
  }

  removeSelected() {
    if (!this.selectedFile) return
    this.files = this.files.filter((f) => f !== this.selectedFile)
    this.selectedFile = null
  }

  clearFiles() {
    this.files = []
    this.selectedFile = null
  }

  clearRules() {
    this.rules = []
    this.selectedRule = null
    this.saveRules()
  }

  addRuleType: RuleType = 'replace'

  openAddRuleDialog(type: RuleType = 'replace') {
    this.editingRule = null
    this.addRuleType = type
    this.dialogOpen = true
  }

  openEditRuleDialog(rule: Rule) {
    this.editingRule = { ...rule, info: { ...rule.info } }
    this.dialogOpen = true
  }

  closeDialog() {
    this.dialogOpen = false
    this.editingRule = null
  }

  addRule(type: RuleType, info: Rule['info']) {
    this.rules.push({
      id: uuid(),
      type,
      enabled: true,
      info,
    })
    this.dialogOpen = false
    this.saveRules()
  }

  updateRule(id: string, info: Rule['info']) {
    const rule = this.rules.find((r) => r.id === id)
    if (rule) {
      rule.info = info
    }
    this.dialogOpen = false
    this.editingRule = null
    this.saveRules()
  }

  selectRule(id: string) {
    this.selectedRule = id
  }

  deleteRule(id: string) {
    this.rules = this.rules.filter((r) => r.id !== id)
    if (this.selectedRule === id) {
      this.selectedRule = null
    }
    this.saveRules()
  }

  deleteSelectedRule() {
    if (!this.selectedRule) return
    this.deleteRule(this.selectedRule)
  }

  toggleRule(id: string) {
    const rule = this.rules.find((r) => r.id === id)
    if (rule) {
      rule.enabled = !rule.enabled
    }
    this.saveRules()
  }

  reorderRule(fromIndex: number, toIndex: number) {
    const [item] = this.rules.splice(fromIndex, 1)
    this.rules.splice(toIndex, 0, item)
    this.saveRules()
  }

  async executeRename() {
    if (this.renaming || !this.hasChanges) return

    this.renaming = true
    try {
      const ops: RenameOperation[] = []

      for (let i = 0; i < this.previews.length; i++) {
        const preview = this.previews[i]
        if (preview.changed) {
          const fileInfo = this.fileInfos[i]
          ops.push({
            oldPath: fileInfo.fullPath,
            newPath: renamer.joinPath(fileInfo.dir, preview.newName),
          })
        }
      }

      if (ops.length === 0) {
        this.renaming = false
        return { success: 0, errors: [] }
      }

      const result = await renamer.renameFiles(toJS(ops))

      // Update file paths for successfully renamed files
      if (result.success > 0) {
        const opsMap = new Map(ops.map((op) => [op.oldPath, op.newPath]))
        this.files = this.files.map((f) => opsMap.get(f) || f)
        this.selectedFile = null
      }

      this.renaming = false
      return result
    } catch {
      this.renaming = false
      return { success: 0, errors: ['Unexpected error'] }
    }
  }
}

export default new Store()
