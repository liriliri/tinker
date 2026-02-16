import { makeAutoObservable, reaction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'
import i18n from './i18n'

const storage = new LocalStore('tinker-mind-map')
const FILE_PATH_KEY = 'file-path'
const STORAGE_KEY_SIDEBAR_OPEN = 'sidebarOpen'

type MindMapInstance = any

class Store extends BaseStore {
  mindMap: MindMapInstance | null = null
  currentLayout: string = 'logicalStructure'
  currentTheme: string = 'default'
  hasActiveNode: boolean = false
  canUndo: boolean = false
  canRedo: boolean = false
  hasChanges: boolean = false
  scale: number = 100
  currentFilePath: string | null = null
  sidebarOpen: boolean = true
  private isLoadingFile: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
    this.bindEvent()
  }

  private loadFromStorage() {
    const savedSidebarOpen = storage.get(STORAGE_KEY_SIDEBAR_OPEN)
    if (savedSidebarOpen !== undefined) {
      this.sidebarOpen = savedSidebarOpen
    }
  }

  private bindEvent() {
    reaction(
      () => this.currentFileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  get currentFileName() {
    if (!this.currentFilePath) return null
    return splitPath(this.currentFilePath).name
  }

  private getDefaultTemplate() {
    return {
      data: {
        text: i18n.t('rootNode'),
      },
      children: [
        {
          data: {
            text: i18n.t('secondaryNode'),
            generalization: {
              text: i18n.t('summary'),
            },
          },
          children: [
            {
              data: {
                text: i18n.t('branchTopic'),
              },
              children: [],
            },
            {
              data: {
                text: i18n.t('branchTopic'),
              },
              children: [],
            },
          ],
        },
      ],
    }
  }

  private async loadSavedFile() {
    const savedFilePath = storage.get(FILE_PATH_KEY)

    if (savedFilePath && this.mindMap) {
      try {
        this.isLoadingFile = true
        const content = await tinker.readFile(savedFilePath, 'utf-8')
        const data = JSON.parse(content as string)
        this.mindMap.setFullData(data)
        this.currentFilePath = savedFilePath
        setTimeout(() => {
          this.hasChanges = false
          this.isLoadingFile = false
          this.fit()
        }, 100)
      } catch {
        storage.remove(FILE_PATH_KEY)
        this.isLoadingFile = false
      }
    }
  }

  setMindMap(mindMap: MindMapInstance) {
    this.mindMap = mindMap
    this.setupListeners()
    this.loadSavedFile()
  }

  private setupListeners() {
    if (!this.mindMap) return

    this.mindMap.on('node_active', (_node: any, _nodeList: any[]) => {
      this.hasActiveNode = _nodeList.length > 0
    })

    this.mindMap.on('back_forward', (index: number, len: number) => {
      this.canUndo = index > 0
      this.canRedo = index < len - 1
    })

    this.mindMap.on('data_change', () => {
      if (!this.isLoadingFile) {
        this.hasChanges = true
        this.saveData()
      }
    })

    this.mindMap.on('scale', (scale: number) => {
      this.scale = Math.round(scale * 100)
    })

    const currentScale = this.mindMap.view.scale || 1
    this.scale = Math.round(currentScale * 100)
  }

  loadData() {
    const savedData = storage.get('mindmap-data')
    if (savedData) {
      return savedData
    }
    return {
      layout: this.currentLayout,
      theme: this.currentTheme,
      root: this.getDefaultTemplate(),
    }
  }

  private saveData() {
    if (!this.mindMap) return
    const data = this.mindMap.getData(true)
    storage.set('mindmap-data', data)
  }

  newFile() {
    if (!this.mindMap) return
    this.isLoadingFile = true
    this.currentFilePath = null
    storage.remove(FILE_PATH_KEY)
    this.mindMap.setData(this.getDefaultTemplate())
    setTimeout(() => {
      this.hasChanges = false
      this.isLoadingFile = false
      this.fit()
    }, 100)
  }

  async openFile() {
    if (!this.mindMap) return

    try {
      const result = await tinker.showOpenDialog({
        filters: [
          { name: 'Mind Map Files', extensions: ['json', 'smm'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePaths.length > 0) {
        this.isLoadingFile = true
        const filePath = result.filePaths[0]
        const content = await tinker.readFile(filePath, 'utf-8')
        const data = JSON.parse(content as string)
        this.mindMap?.setFullData(data)
        this.currentFilePath = filePath
        storage.set(FILE_PATH_KEY, filePath)
        setTimeout(() => {
          this.hasChanges = false
          this.isLoadingFile = false
          this.fit()
        }, 100)
      }
    } catch {
      this.isLoadingFile = false
      alert({ title: 'Failed to open file' })
    }
  }

  async saveFile() {
    if (!this.mindMap) return

    try {
      const data = this.mindMap.getData(true)
      const content = JSON.stringify(data, null, 2)

      if (this.currentFilePath) {
        await tinker.writeFile(this.currentFilePath, content)
        this.hasChanges = false
      } else {
        const result = await tinker.showSaveDialog({
          defaultPath: 'mindmap.smm',
          filters: [
            { name: 'Mind Map Files', extensions: ['json', 'smm'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        })

        if (!result.canceled && result.filePath) {
          await tinker.writeFile(result.filePath, content)
          this.currentFilePath = result.filePath
          this.hasChanges = false
          storage.set(FILE_PATH_KEY, result.filePath)
        }
      }
    } catch {
      alert({ title: 'Failed to save file' })
    }
  }

  undo() {
    this.mindMap?.execCommand('BACK')
  }

  redo() {
    this.mindMap?.execCommand('FORWARD')
  }

  addNode() {
    this.mindMap?.execCommand('INSERT_CHILD_NODE')
  }

  deleteNode() {
    this.mindMap?.execCommand('REMOVE_NODE')
  }

  setLayout(layout: string) {
    this.currentLayout = layout
    this.mindMap?.setLayout(layout)
  }

  setTheme(theme: string) {
    this.currentTheme = theme
    this.mindMap?.setTheme(theme)
  }

  zoomIn() {
    this.mindMap?.view.enlarge()
  }

  zoomOut() {
    this.mindMap?.view.narrow()
  }

  setZoom(percent: number) {
    if (!this.mindMap) return
    const scale = percent / 100
    this.mindMap.view.setScale(scale)
  }

  fit() {
    this.mindMap?.view.fit()
  }

  async exportImage() {
    if (!this.mindMap) return

    try {
      const dataUrl = await this.mindMap.export('png', true, 'mindmap')
      const link = document.createElement('a')
      link.download = 'mindmap.png'
      link.href = dataUrl
      link.click()
    } catch {
      alert({ title: 'Failed to export image' })
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(STORAGE_KEY_SIDEBAR_OPEN, this.sidebarOpen)
  }

  setSidebarOpen(open: boolean) {
    this.sidebarOpen = open
    storage.set(STORAGE_KEY_SIDEBAR_OPEN, this.sidebarOpen)
  }

  showNodeContextMenu(e: any, node: any) {
    const isRoot = node.isRoot
    const isGeneralization = node.isGeneralization
    const hasHyperlink = !!node.getData('hyperlink')
    const hasNote = !!node.getData('note')

    const parent = node.parent
    const siblings = parent?.children || []
    const nodeIndex = siblings.findIndex((n: any) => n === node)
    const canMoveUp = !isRoot && !isGeneralization && nodeIndex > 0
    const canMoveDown =
      !isRoot && !isGeneralization && nodeIndex < siblings.length - 1
    const canInsertSibling = !isRoot && !isGeneralization

    const items: any[] = [
      {
        label: i18n.t('insertChildNode'),
        enabled: !isGeneralization,
        click: () => this.mindMap?.execCommand('INSERT_CHILD_NODE'),
      },
      {
        label: i18n.t('insertSiblingNode'),
        enabled: canInsertSibling,
        click: () => this.mindMap?.execCommand('INSERT_NODE'),
      },
      { type: 'separator' as const },
      {
        label: i18n.t('moveUpNode'),
        enabled: canMoveUp,
        click: () => this.mindMap?.execCommand('UP_NODE'),
      },
      {
        label: i18n.t('moveDownNode'),
        enabled: canMoveDown,
        click: () => this.mindMap?.execCommand('DOWN_NODE'),
      },
      { type: 'separator' as const },
      {
        label: i18n.t('expandNodeChild'),
        click: () => this.mindMap?.execCommand('EXPAND_ALL', node.uid),
      },
      {
        label: i18n.t('unExpandNodeChild'),
        click: () => this.mindMap?.execCommand('UNEXPAND_ALL', false, node.uid),
      },
      { type: 'separator' as const },
      {
        label: i18n.t('copyNode'),
        enabled: !isGeneralization,
        click: () => this.mindMap?.renderer.copy(),
      },
      {
        label: i18n.t('cutNode'),
        enabled: !isGeneralization,
        click: () => this.mindMap?.renderer.cut(),
      },
      {
        label: i18n.t('pasteNode'),
        click: () => this.mindMap?.renderer.paste(),
      },
      { type: 'separator' as const },
      {
        label: i18n.t('deleteNode'),
        click: () => this.mindMap?.execCommand('REMOVE_NODE'),
      },
      { type: 'separator' as const },
      {
        label: i18n.t('removeHyperlink'),
        enabled: hasHyperlink,
        click: () => node.setHyperlink('', ''),
      },
      {
        label: i18n.t('removeNote'),
        enabled: hasNote,
        click: () => node.setNote(''),
      },
    ]

    tinker.showContextMenu(
      e.clientX,
      e.clientY,
      items.filter((item: any) => {
        if (item.type === 'separator') return true
        return item.enabled !== false
      })
    )
  }
}

const store = new Store()

export default store
