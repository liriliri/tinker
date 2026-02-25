import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
  MenuItemConstructorOptions,
} from 'electron'

type ReadFile = typeof import('node:fs/promises').readFile
type WriteFile = typeof import('node:fs/promises').writeFile

interface RunProgress {
  /** e.g., "1024kbits/s" */
  bitrate: string
  fps: number
  frame: number
  /** 0-100, only available when duration is known */
  percent?: number
  q: number | string
  /** in bytes */
  size: number
  /** e.g., "1.5x" */
  speed: string
  /** e.g., "00:01:23.45" */
  time: string
}

interface FFmpegTask {
  /** Force kill (SIGKILL) */
  kill(): void
  /** Graceful quit (SIGTERM) */
  quit(): void
}

interface VideoStream {
  codec: string
  width: number
  height: number
  fps: number
  bitrate?: number
  /** JPEG data URL */
  thumbnail: string
}

interface AudioStream {
  codec: string
  /** in Hz */
  sampleRate?: number
  bitrate?: number
}

interface MediaInfo {
  /** in bytes */
  size: number
  /** in seconds */
  duration: number
  /** present only if the file contains a video stream */
  videoStream?: VideoStream
  /** present only if the file contains an audio stream */
  audioStream?: AudioStream
}

declare global {
  const tinker: {
    /** @returns 'light' or 'dark' */
    getTheme(): Promise<string>

    /** @returns Language code (e.g., 'en-US', 'zh-CN') */
    getLanguage(): Promise<string>

    /** Show a native file open dialog. */
    showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>

    /** Show a native file save dialog. */
    showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue>

    /** Show the given file in the system file manager. */
    showItemInPath(path: string): void

    /**
     * Set the window title.
     * Empty string resets to plugin name; otherwise formatted as "{title} - {plugin name}".
     */
    setTitle(title: string): void

    /** Get file paths from the system clipboard. */
    getClipboardFilePaths(): Promise<string[]>

    /** @returns Data URL of the screenshot, or empty string if canceled or failed */
    captureScreen(): Promise<string>

    /**
     * Get the icon for a file or file extension.
     * @param filePath - File path or extension (e.g., '/path/to/file.pdf' or '.pdf')
     * @returns PNG data URL
     */
    getFileIcon(filePath: string): Promise<string>

    /** Wraps Node's fs.promises.readFile */
    readFile: ReadFile

    /** Wraps Node's fs.promises.writeFile */
    writeFile: WriteFile

    /** Returns the OS temp directory path. */
    tmpdir(): string

    /**
     * Register an event listener.
     * @param event - e.g., 'changeTheme', 'changeLanguage'
     * @returns Unsubscribe function
     */
    on(event: string, callback: (...args: any[]) => void): () => void

    /**
     * Run FFmpeg with the specified arguments.
     * @param args - FFmpeg args (without 'ffmpeg' itself), must include output file path
     * @example
     * const task = tinker.runFFmpeg(
     *   ['-i', 'input.mp4', '-c:v', 'libx264', 'output.mp4'],
     *   (progress) => console.log(`${progress.percent}%`)
     * )
     * task.kill()
     */
    runFFmpeg(
      args: string[],
      onProgress?: (progress: RunProgress) => void
    ): FFmpegTask

    /**
     * Get media information for a file using FFmpeg.
     * Throws if the file is not a valid media file.
     */
    getMediaInfo(filePath: string): Promise<MediaInfo>

    /**
     * Show a context menu at the specified position.
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
