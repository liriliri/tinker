import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
  MenuItemConstructorOptions,
} from 'electron'

type ReadFile = typeof import('node:fs/promises').readFile
type WriteFile = typeof import('node:fs/promises').writeFile

/**
 * FFmpeg execution progress information.
 */
interface RunProgress {
  /** Video bitrate (e.g., "1024kbits/s") */
  bitrate: string
  /** Frames per second */
  fps: number
  /** Current frame number */
  frame: number
  /** Conversion progress percentage (0-100), only available when duration is known */
  percent?: number
  /** Video quality factor */
  q: number | string
  /** Current output size (e.g., "1024kB") */
  size: string
  /** Processing speed (e.g., "1.5x") */
  speed: string
  /** Current processing time (e.g., "00:01:23.45") */
  time: string
}

/**
 * FFmpeg task control interface.
 */
interface FFmpegTask {
  /** Force kill the FFmpeg process (SIGKILL) */
  kill(): void
  /** Gracefully quit the FFmpeg process (SIGTERM) */
  quit(): void
}

/**
 * Video stream information parsed from media file.
 */
interface VideoStream {
  /** Video codec name (e.g., "h264", "vp9") */
  codec: string
  /** Video width in pixels */
  width: number
  /** Video height in pixels */
  height: number
  /** Frame rate (e.g., 29.97) */
  fps: number
  /** Video bitrate in kb/s */
  bitrate?: number
  /** Thumbnail of the video as a JPEG data URL */
  thumbnail: string
}

/**
 * Audio stream information parsed from media file.
 */
interface AudioStream {
  /** Audio codec name (e.g., "aac", "mp3") */
  codec: string
  /** Sample rate in Hz (e.g., 44100) */
  sampleRate?: number
  /** Audio bitrate in kb/s */
  bitrate?: number
}

/**
 * Media file information returned by getMediaInfo.
 */
interface MediaInfo {
  /** Duration in seconds */
  duration: number
  /** Video stream info, present only if the file contains a video stream */
  videoStream?: VideoStream
  /** Audio stream info, present only if the file contains an audio stream */
  audioStream?: AudioStream
}

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
     * Set the window title.
     * @param title - The title text. If empty, will use the plugin name. If non-empty, will be formatted as "{title} - {plugin name}"
     * @example
     * tinker.setTitle('My Custom Title')
     * // Window title becomes: "My Custom Title - Plugin Name"
     *
     * tinker.setTitle('')
     * // Window title becomes: "Plugin Name"
     */
    setTitle(title: string): void

    /**
     * Get file paths from the system clipboard.
     * @returns Array of file paths
     * @example
     * const filePaths = await tinker.getClipboardFilePaths()
     * console.log(filePaths) // ['/path/to/file1.png', '/path/to/file2.jpg']
     */
    getClipboardFilePaths(): Promise<string[]>

    /**
     * Capture a screenshot of the screen.
     * @returns Data URL of the captured screenshot, or empty string if canceled or failed
     * @example
     * const dataUrl = await tinker.captureScreen()
     * if (dataUrl) {
     *   const img = document.createElement('img')
     *   img.src = dataUrl
     *   document.body.appendChild(img)
     * }
     */
    captureScreen(): Promise<string>

    /**
     * Get the icon for a file or file extension.
     * @param filePath - File path or extension (e.g., '/path/to/file.pdf' or '.pdf')
     * @returns PNG Data URL of the file icon
     * @example
     * // Get icon by file extension
     * const pdfIcon = await tinker.getFileIcon('.pdf')
     * const img = document.createElement('img')
     * img.src = pdfIcon
     *
     * // Get icon by file path
     * const fileIcon = await tinker.getFileIcon('/path/to/document.docx')
     */
    getFileIcon(filePath: string): Promise<string>

    /**
     * Read a file from the filesystem using Node's fs.promises.readFile.
     * @param path - File path or URL
     * @param options - Encoding or read options
     * @returns Buffer or string depending on options
     * @example
     * const content = await tinker.readFile('/path/to/file.txt', 'utf-8')
     */
    readFile: ReadFile

    /**
     * Write data to a file using Node's fs.promises.writeFile.
     * @param path - File path or URL
     * @param data - Data to write
     * @param options - Write options
     * @example
     * await tinker.writeFile('/path/to/file.txt', 'Hello World')
     */
    writeFile: WriteFile

    /**
     * Get the operating system's default directory for temporary files.
     * @returns Path to the temp directory
     * @example
     * const tempDir = tinker.tmpdir()
     * console.log(tempDir) // e.g., '/tmp' on macOS/Linux or 'C:\Users\...\AppData\Local\Temp' on Windows
     *
     * // Use it to create temp files
     * const tempFile = `${tempDir}/my-temp-file.txt`
     * await tinker.writeFile(tempFile, 'temporary data')
     */
    tmpdir(): string

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
     * Run FFmpeg with the specified arguments.
     * @param args - FFmpeg command line arguments (without 'ffmpeg' itself). Must include output file path.
     * @param onProgress - Optional progress callback function
     * @returns Task control object with kill() and quit() methods
     * @example
     * // Convert video to different format
     * const task = tinker.runFFmpeg(
     *   ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4'],
     *   (progress) => {
     *     console.log(`Progress: ${progress.percent}%`)
     *     console.log(`Speed: ${progress.speed}`)
     *   }
     * )
     *
     * // Kill the task if needed
     * task.kill()  // Force kill (SIGKILL)
     * task.quit()  // Graceful quit (SIGTERM)
     */
    runFFmpeg(
      args: string[],
      onProgress?: (progress: RunProgress) => void
    ): FFmpegTask

    /**
     * Get media information for a file using FFmpeg.
     * Throws an error if the file is not a valid media file.
     * @param filePath - Absolute path to the media file
     * @returns Media info including duration, video stream, and audio stream
     * @example
     * const info = await tinker.getMediaInfo('/path/to/video.mp4')
     * console.log(info.duration)               // e.g., 123.4
     * console.log(info.videoStream?.codec)     // e.g., 'h264'
     * console.log(info.videoStream?.thumbnail) // 'data:image/jpeg;base64,...'
     * console.log(info.audioStream?.codec)     // e.g., 'aac'
     * console.log(info.audioStream?.sampleRate) // e.g., 44100
     */
    getMediaInfo(filePath: string): Promise<MediaInfo>

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
