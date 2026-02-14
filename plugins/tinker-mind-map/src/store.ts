import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { alert } from 'share/components/Alert'

const storage = new LocalStore('tinker-mind-map')

type MindMapInstance = any

class Store extends BaseStore {
  mindMap: MindMapInstance | null = null
  currentLayout: string = 'logicalStructure'
  currentTheme: string = 'default'
  hasActiveNode: boolean = false
  canUndo: boolean = false
  canRedo: boolean = false
  hasChanges: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
  }

  setMindMap(mindMap: MindMapInstance) {
    this.mindMap = mindMap
    this.setupListeners()
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
      this.hasChanges = true
      this.saveData()
    })
  }

  loadData() {
    const savedData = storage.get('mindmap-data')
    if (savedData) {
      return savedData
    }
    return {
      layout: this.currentLayout,
      theme: this.currentTheme,
      root: {
        data: {
          text: 'Root Node',
        },
        children: [],
      },
    }
  }

  private saveData() {
    if (!this.mindMap) return
    const data = this.mindMap.getData(true)
    storage.set('mindmap-data', data)
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
        const filePath = result.filePaths[0]
        const content = await tinker.readFile(filePath, 'utf-8')
        const data = JSON.parse(content as string)
        this.mindMap?.setFullData(data)
        this.hasChanges = false
      }
    } catch {
      alert({ title: 'Failed to open file' })
    }
  }

  async saveFile() {
    if (!this.mindMap) return

    try {
      const data = this.mindMap.getData(true)
      const content = JSON.stringify(data, null, 2)

      const result = await tinker.showSaveDialog({
        defaultPath: 'mindmap.json',
        filters: [
          { name: 'Mind Map Files', extensions: ['json', 'smm'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (!result.canceled && result.filePath) {
        await tinker.writeFile(result.filePath, content)
        this.hasChanges = false
        alert({ title: 'File saved successfully' })
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
}

const store = new Store()

export default store
