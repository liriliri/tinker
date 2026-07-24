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
type Rm = typeof import('node:fs/promises').rm

declare global {
  namespace tinker {
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

    interface FFmpegProgress {
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

    interface DiskUsageOptions {
      /** Absolute or relative paths to analyze. */
      paths: string[]
      /**
       * Maximum depth to request from `pdu`.
       * Sizes beyond this depth still count toward ancestor totals.
       * `0` is accepted here and normalized to `1` so the returned tree keeps
       * only the root node.
       */
      maxDepth?: number
      /**
       * How disk usage is measured.
       * - `apparent-size`: logical file size in bytes.
       * - `block-size`: allocated size in bytes.
       * - `block-count`: allocated block count.
       */
      quantity?: 'apparent-size' | 'block-size' | 'block-count'
      /**
       * Minimum size ratio required for a node to appear in the returned tree.
       * The ratio is relative to the root total size.
       * Example: `0.01` means only nodes at least 1% of the root are kept.
       * Use `0` to disable filtering and keep all nodes.
       * If omitted, the default implementation value is used.
       */
      minRatio?: number
      /** Suppress filesystem errors from stderr output. */
      silentErrors?: boolean
      /** Number of worker threads used during scanning. */
      threads?: number
      /** Deduplicate hardlinks when calculating sizes. */
      deduplicateHardlinks?: boolean
    }

    interface DiskUsageProgress {
      /** Number of scanned filesystem items. */
      count: number
      /** Total scanned size. */
      size: number
      /** Number of filesystem errors encountered during scanning. */
      errors: number
    }

    interface DiskUsageResult {
      name: string
      /** Measured size of this node. */
      size: number
      /** Child nodes included in the returned tree. */
      children: DiskUsageResult[]
    }

    interface DiskUsageTask extends Promise<DiskUsageResult> {
      kill(): void
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
      /** JPEG data URL, extracted from embedded cover art */
      cover?: string
    }

    interface MediaMetadata {
      title?: string
      artist?: string
      album?: string
    }

    interface MediaInfo {
      /** in bytes */
      size: number
      /** in seconds */
      duration: number
      /** file-level metadata (title, artist, album) */
      metadata?: MediaMetadata
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
      reasoningContent?: string
      toolCalls?: any[]
      toolCallId?: string
      toolName?: string
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
      reasoningContent?: string
      toolCalls?: any[]
      done?: boolean
      error?: string
    }

    interface AiStreamTask extends Promise<void> {
      abort(): void
    }

    interface DownloadOptions {
      /** Download URL */
      url: string
      /** Full save path (required) */
      savePath: string
    }

    interface DownloadProgress {
      /** 'progressing' | 'interrupted' | 'completed' | 'cancelled' */
      state: string
      /** bytes/sec */
      speed: number
      totalBytes: number
      receivedBytes: number
      paused: boolean
    }

    interface DownloadTask extends Promise<void>, DownloadProgress {
      /** Unique identifier for this download */
      id: string
      url: string
      savePath: string
      pause(): void
      resume(): void
      cancel(): void
      /**
       * Delete this download record.
       * If the download is in progress, it will be cancelled first.
       * The record is permanently removed and will not appear in getDownloads().
       */
      delete(): void
      /**
       * Register a progress listener. Called whenever download progress updates.
       * @returns Unsubscribe function
       */
      onProgress(callback: () => void): () => void
    }

    interface SearchFileResult {
      /** Full file path */
      path: string
      /** File size in bytes */
      size: number
      /** Last modification time as Unix timestamp (ms) */
      dateModified: number
    }

    interface SearchFileOptions {
      /** Pagination offset (default: 0) */
      offset?: number
      /** Maximum number of results (default: 50) */
      maxResults?: number
      /** Restrict search to specific directories */
      dirs?: string[]
      /** Filter by file extensions (without dot), e.g. ['mp3', 'flac'] */
      exts?: string[]
    }

    interface SearchFileTask extends Promise<SearchFileResult[]> {
      /** Force kill (SIGKILL) */
      kill(): void
      /** Graceful quit (SIGTERM) */
      quit(): void
    }

    interface SearchTextSubmatch {
      /** The matched substring */
      text: string
      /** Byte offset of the match start within the line */
      start: number
      /** Byte offset of the match end within the line */
      end: number
    }

    interface SearchTextResult {
      /** Absolute file path of the matched file */
      path: string
      /** 1-based line number of the match */
      lineNumber: number
      /** Full content of the matched line (may include trailing newline) */
      text: string
      /** Per-hit ranges within `text` (multiple hits possible per line) */
      submatches: SearchTextSubmatch[]
    }

    interface SearchTextOptions {
      /** Directories to search in. Defaults to ripgrep's CWD if omitted. */
      dirs?: string[]
      /** Filter by file extensions (without dot), e.g. ['ts', 'tsx'] */
      exts?: string[]
      /** Include pattern string (VS Code search viewlet format) */
      includes?: string
      /** Exclude pattern string */
      excludes?: string
      /** Legacy ripgrep glob patterns. Prefer includes/excludes. */
      globs?: string[]
      /** Case-sensitive match. Default: false */
      caseSensitive?: boolean
      /** Match whole words only (`--word-regexp`) */
      wholeWord?: boolean
      /** Treat `query` as a regex. Default: false (literal/fixed-string) */
      regex?: boolean
      /** Allow multiline regex matches (`--multiline`) */
      multiline?: boolean
      /** Stop after this many matches (default: 1000) */
      maxResults?: number
      /** Skip files larger than this, e.g. '2M', '500K' */
      maxFilesize?: string
      /** Search hidden files and dirs (`--hidden`) */
      hidden?: boolean
      /** Follow symbolic links (`-L`) */
      followSymlinks?: boolean
    }

    interface SearchTextTask extends Promise<SearchTextResult[]> {
      /** Force kill (SIGKILL) */
      kill(): void
      /** Graceful quit (SIGTERM) */
      quit(): void
    }

    interface WebviewTag extends Electron.WebviewTag {
      sendCommand(
        method: string,
        params?: Record<string, unknown>
      ): Promise<unknown>
      showDevTools(devtoolsWebview: Electron.WebviewTag): Promise<void>
    }

    interface CreateTerminalOptions {
      cols: number
      rows: number
      /** Working directory; defaults to the user home directory. */
      cwd?: string
      /** Shell executable path; defaults to the system default shell. */
      shell?: string
    }

    interface Terminal {
      /** Send input to the shell. */
      write(data: string): void
      /** Resize the PTY. */
      resize(cols: number, rows: number): void
      /** Kill the session. After this all other methods are no-ops. */
      destroy(): void
      /** Subscribe to shell output. Latest registration wins. */
      onData(callback: (data: string) => void): void
      /** Subscribe to process exit. Latest registration wins. */
      onClose(callback: () => void): void
      /** Subscribe to user-input newline events. Latest registration wins. */
      onInput(callback: () => void): void
      /**
       * Get the session's foreground process name and current working
       * directory in one IPC round trip.
       */
      getInfo(): Promise<tinker.TerminalInfo>
    }

    interface TerminalInfo {
      /** Foreground process name (e.g. "vim", "zsh"). */
      processName: string
      /** Full path of the current working directory. */
      cwd: string
    }
  }

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

    /** Open a URL in the system default browser. */
    openExternal(url: string): void

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

    /**
     * Show a system notification.
     * The notification title and icon are automatically set to the current plugin's name and icon.
     * @param body - The notification body text
     */
    showNotification(body: string): void

    /** Wraps Node's fs.promises.readFile */
    readFile: ReadFile

    /** Wraps Node's fs.promises.writeFile */
    writeFile: WriteFile

    /** Wraps Node's fs.promises.rm */
    rm: Rm

    /** Get file stats (size, timestamps, type flags). */
    fstat(path: string): Promise<tinker.FileStats>

    /**
     * Get the path to a special directory or file associated with name.
     * Equivalent to Electron's app.getPath(name).
     */
    getPath(name: Parameters<App['getPath']>[0]): Promise<string>

    /**
     * Get the absolute path for a File from drag-drop or file input.
     * Returns an empty string if the path cannot be determined.
     */
    getPathForFile(file: File): string

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
      onProgress?: (progress: tinker.FFmpegProgress) => void
    ): tinker.FFmpegTask

    /**
     * Get media information for a file using FFmpeg.
     * Throws if the file is not a valid media file.
     */
    getMediaInfo(filePath: string): Promise<tinker.MediaInfo>

    /**
     * Analyze disk usage for one or more paths.
     *
     * The returned value is a promise-like task that resolves to a tree of
     * `{ name, size, children }`.
     *
     * Notes:
     * - `maxDepth` only limits how deep the returned tree goes; deeper sizes still
     *   contribute to ancestor totals.
     * - `minRatio` filters small nodes from the returned tree relative to the root.
     *   Use `minRatio: 0` if you need every file node.
     * - Progress `count` means scanned item count, not returned node count.
     *
     * @example
     * const task = tinker.getDiskUsage(
     *   { paths: ['/Users/xxx/Documents'], maxDepth: 5, minRatio: 0 },
     *   (progress) => console.log(`scanned ${progress.count} items`)
     * )
     * task.kill() // cancel
     * const data = await task
     */
    getDiskUsage(
      options: tinker.DiskUsageOptions,
      onProgress?: (progress: tinker.DiskUsageProgress) => void
    ): tinker.DiskUsageTask

    /** Get a list of installed applications. */
    getApps(): Promise<tinker.AppInfo[]>

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
    callAI(option: tinker.AiCallOption): Promise<tinker.AiResult>

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
      option: tinker.AiCallOption,
      onChunk: (chunk: tinker.AiChunk) => void
    ): tinker.AiStreamTask

    /** Get the list of configured AI providers (name and models only). */
    getAIProviders(): Promise<tinker.AiProviderInfo[]>

    /**
     * Start a file download.
     * The download runs in the background and persists even if the plugin is closed.
     * Progress is tracked on the returned task object. Use task.onProgress() to listen for updates.
     * @param options - Download URL and optional save path/filename
     * @returns Task object with pause()/resume()/cancel()/delete()/onProgress() methods
     * @example
     * const task = tinker.download({ url: 'https://example.com/file.zip' })
     * task.onProgress(() => console.log(`${task.receivedBytes}/${task.totalBytes}`))
     * task.pause()
     * task.resume()
     * task.cancel()
     * await task
     */
    download(options: tinker.DownloadOptions): tinker.DownloadTask

    /**
     * Get all downloads belonging to this plugin.
     * Returns downloads of all states (including completed/cancelled) as DownloadTask objects.
     * Active downloads have working pause()/resume()/cancel() controls.
     * Completed/cancelled downloads have no-op control methods and are already resolved/rejected.
     */
    getDownloads(): Promise<tinker.DownloadTask[]>

    /**
     * Search files on the system.
     * Uses Spotlight on macOS and Everything on Windows.
     * Returns empty array on other platforms.
     * @param query - Search query string
     * @param options - Optional search options
     * @example
     * const task = tinker.searchFile('*.pdf')
     * task.kill() // cancel the search
     * const results = await task
     * @example
     * // Search audio files in specific directories
     * const task = tinker.searchFile('song', { dirs: ['/Users/me/Music'], exts: ['mp3', 'flac'] })
     */
    searchFile(
      query: string,
      options?: tinker.SearchFileOptions
    ): tinker.SearchFileTask

    /**
     * Search for text content inside files using ripgrep.
     * Returns matches across files (path + line + per-hit ranges).
     * The promise resolves with the full result array when ripgrep completes
     * or `maxResults` is hit; pass `onMatch` to also consume matches as they
     * stream in for incremental UI rendering.
     * @param query - Search string (literal by default, regex if `options.regex` is true)
     * @param options - Optional search options (dirs, exts, regex flags, etc.)
     * @param onMatch - Optional callback fired once per match as ripgrep emits it
     * @example
     * // One-shot
     * const results = await tinker.searchText('TODO', {
     *   dirs: ['/Users/me/proj'],
     *   exts: ['ts', 'tsx'],
     * })
     * @example
     * // Streaming
     * const task = tinker.searchText(
     *   'fetch\\w+',
     *   { dirs: ['./src'], regex: true, maxResults: 5000 },
     *   (m) => appendRow(m)
     * )
     * setTimeout(() => task.kill(), 5000) // cancel midway
     * const all = await task
     */
    searchText(
      query: string,
      options?: tinker.SearchTextOptions,
      onMatch?: (match: tinker.SearchTextResult) => void
    ): tinker.SearchTextTask

    /**
     * Spawn a PTY shell session in the main process. The session is
     * automatically destroyed when the plugin's webContents is closed.
     */
    createTerminal(options: tinker.CreateTerminalOptions): tinker.Terminal

    /**
     * Register the plugin MCP API (currently `callTool`; may grow later).
     * `callTool` may return any value; non-strings are JSON-serialized for
     * the host bridge.
     */
    registerMcp(api: {
      callTool: (
        name: string,
        args: Record<string, unknown>
      ) => unknown | Promise<unknown>
    }): void
  }
}

export {}
