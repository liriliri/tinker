import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from 'electron'

declare global {
  /**
   * Global Tinker API for plugin development.
   * Provides access to system features, dialogs, and theme management.
   */
  const tinker: {
    /**
     * Get the current theme.
     * @returns 'light' or 'dark'
     * @example
     * const theme = await tinker.getTheme()
     * console.log(theme) // 'dark'
     */
    getTheme(): Promise<string>

    /**
     * Get the user's language setting.
     * @returns Language code (e.g., 'en-US', 'zh-CN')
     * @example
     * const lang = await tinker.getLanguage()
     * i18n.changeLanguage(lang)
     */
    getLanguage(): Promise<string>

    /**
     * Show a native file open dialog.
     * @param options - Dialog options (title, filters, properties, etc.)
     * @returns Object with canceled flag and filePaths array
     * @example
     * const result = await tinker.showOpenDialog({
     *   title: 'Select Image',
     *   filters: [{ name: 'Images', extensions: ['png', 'jpg'] }],
     *   properties: ['openFile']
     * })
     * if (!result.canceled) {
     *   console.log(result.filePaths[0])
     * }
     */
    showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>

    /**
     * Show a native file save dialog.
     * @param options - Dialog options (title, defaultPath, filters, etc.)
     * @returns Object with canceled flag and filePath string
     * @example
     * const result = await tinker.showSaveDialog({
     *   title: 'Save Image',
     *   defaultPath: 'output.png',
     *   filters: [{ name: 'PNG', extensions: ['png'] }]
     * })
     * if (!result.canceled) {
     *   // Save to result.filePath
     * }
     */
    showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue>

    /**
     * Show the given file in the system file manager.
     * @param path - Absolute path to the file
     * @example
     * tinker.showItemInPath('/path/to/file.png')
     */
    showItemInPath(path: string): void

    /**
     * Register an event listener.
     * @param event - Event name (e.g., 'changeTheme', 'changeLanguage')
     * @param callback - Event handler function
     * @returns Unsubscribe function
     * @example
     * const unsubscribe = tinker.on('changeTheme', async () => {
     *   const theme = await tinker.getTheme()
     *   store.setIsDark(theme === 'dark')
     * })
     * // Later: unsubscribe()
     */
    on(event: string, callback: (...args: any[]) => void): () => void

    /**
     * Show a context menu at the specified position.
     * @param x - X coordinate (px)
     * @param y - Y coordinate (px)
     * @param options - Menu items array
     * @example
     * tinker.showContextMenu(event.clientX, event.clientY, [
     *   { label: 'Copy', click: () => handleCopy() },
     *   { type: 'separator' },
     *   { label: 'Delete', click: () => handleDelete() }
     * ])
     */
    showContextMenu: (
      x: number,
      y: number,
      options: MenuItemConstructorOptions[]
    ) => void
  }
}

export {}
