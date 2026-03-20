import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
  MenuItemConstructorOptions,
  App,
} from 'electron'

type ReadFile = typeof import('node:fs/promises').readFile
type WriteFile = typeof import('node:fs/promises').writeFile

interface FileStats {
  /** File size in bytes */
  size: number
  /** Last modification time */
  mtime: Date
  /** Last access time */
  atime: Date
  /** Last status change time */
  ctime: Date
  isFile: boolean
  isDirectory: boolean
  isSymbolicLink: boolean
}

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

interface FFmpegTask extends Promise<void> {
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

interface AppInfo {
  name: string
  /** Absolute path to the application icon */
  icon: string
  /** Absolute path to the application */
  path: string
}

interface AiModel {
  name: string
  capabilities?: string[]
  contextWindow?: number
  maxOutput?: number
}

interface AiProviderInfo {
  name: string
  models: AiModel[]
}

interface AiProvider {
  name: string
  apiUrl: string
  apiKey: string
  models: AiModel[]
}

interface AiMessage {
  role: string
  content?: string | any[]
  reasoning_content?: string
  tool_calls?: any[]
  tool_call_id?: string
}

interface AiCallOption {
  provider?: string
  model?: string
  messages: AiMessage[]
  tools?: any[]
  temperature?: number
  maxTokens?: number
}

interface AiResult {
  success: boolean
  data?: AiMessage
  error?: string
}

interface AiChunk {
  content?: string
  reasoning_content?: string
  tool_calls?: any[]
  done?: boolean
  error?: string
}

interface AiStreamTask extends Promise<void> {
  abort(): void
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

    /** Get file stats (size, timestamps, type flags). */
    fstat(path: string): Promise<FileStats>

    /**
     * Get the path to a special directory or file associated with name.
     * Equivalent to Electron's app.getPath(name).
     */
    getPath(name: Parameters<App['getPath']>[0]): Promise<string>

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

    /** Get a list of installed applications. */
    getApps(): Promise<AppInfo[]>

    /** Get a setting value by name. Only available to builtin plugins. */
    getSetting(name: string): Promise<any>

    /** Set a setting value by name. Only available to builtin plugins. */
    setSetting(name: string, val: any): Promise<void>

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

    /**
     * Call AI with a non-streaming request.
     * Uses the configured AI provider to send messages and receive a response.
     * @param option - Call options including messages, provider, tools, etc.
     * @returns Result with success flag and response message or error
     */
    callAI(option: AiCallOption): Promise<AiResult>

    /**
     * Call AI with a streaming request.
     * Streams response chunks via callback as they arrive.
     * @param option - Call options including messages, provider, tools, etc.
     * @param onChunk - Callback invoked for each chunk; chunk.done signals completion
     * @returns Task object with abort() method to cancel the stream
     * @example
     * const task = tinker.callAIStream(
     *   { messages: [{ role: 'user', content: 'Hello' }] },
     *   (chunk) => {
     *     if (chunk.content) process.stdout.write(chunk.content)
     *     if (chunk.done) console.log('Done')
     *   }
     * )
     * // To cancel:
     * task.abort()
     */
    callAIStream(
      option: AiCallOption,
      onChunk: (chunk: AiChunk) => void
    ): AiStreamTask

    /** Get the list of configured AI providers (name and models only). */
    getAIProviders(): Promise<AiProviderInfo[]>
  }
}

export {}
