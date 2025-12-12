import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from 'electron'

declare global {
  const tinker: {
    getTheme(): Promise<string>
    getLanguage(): Promise<string>
    showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>
    showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue>
    showItemInPath(path: string): void
    on(event: string, callback: (...args: any[]) => void): () => void
    showContextMenu: (
      x: number,
      y: number,
      options: MenuItemConstructorOptions[]
    ) => void
  }
}

export {}
