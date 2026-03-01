import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import type { SystemInfo } from '../common/types'

class Store extends BaseStore {
  activeTab: string = 'components'

  sliderValue: number = 50
  checkboxChecked: boolean = false
  selectValue: string = 'option1'
  textInputValue: string = ''
  isLoading: boolean = false

  theme: string = ''
  language: string = ''
  windowTitle: string = ''
  openedFilePath: string = ''
  clipboardFiles: string[] = []

  cmdInput: string = ''
  cmdOutput: string = ''
  cmdError: string = ''
  cmdRunning: boolean = false

  systemInfo: SystemInfo | null = null

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setActiveTab(tabId: string) {
    this.activeTab = tabId
  }

  setSliderValue(value: number) {
    this.sliderValue = value
  }

  setCheckboxChecked(checked: boolean) {
    this.checkboxChecked = checked
  }

  setSelectValue(value: string) {
    this.selectValue = value
  }

  setTextInputValue(value: string) {
    this.textInputValue = value
  }

  toggleLoading() {
    this.isLoading = true
    setTimeout(() => {
      this.isLoading = false
    }, 2000)
  }

  async fetchTheme() {
    this.theme = await tinker.getTheme()
  }

  async fetchLanguage() {
    this.language = await tinker.getLanguage()
  }

  setWindowTitle(title: string) {
    this.windowTitle = title
  }

  applyWindowTitle() {
    tinker.setTitle(this.windowTitle)
  }

  async openFile() {
    const result = await tinker.showOpenDialog({ properties: ['openFile'] })
    if (!result.canceled && result.filePaths.length > 0) {
      this.openedFilePath = result.filePaths[0]
    }
  }

  showInFinder() {
    if (this.openedFilePath) {
      tinker.showItemInPath(this.openedFilePath)
    }
  }

  async fetchClipboardFiles() {
    this.clipboardFiles = await tinker.getClipboardFilePaths()
  }

  setCmdInput(cmd: string) {
    this.cmdInput = cmd
  }

  async runCommand() {
    if (!this.cmdInput || this.cmdRunning) return
    this.cmdRunning = true
    this.cmdOutput = ''
    this.cmdError = ''
    const result = await template.execCommand(this.cmdInput)
    this.cmdOutput = result.stdout
    this.cmdError = result.stderr
    this.cmdRunning = false
  }

  fetchSystemInfo() {
    this.systemInfo = template.getSystemInfo()
  }
}

export default new Store()
