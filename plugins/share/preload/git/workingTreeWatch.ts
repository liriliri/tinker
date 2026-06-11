import { execFile } from 'child_process'
import { watch, type FSWatcher } from 'chokidar'
import debounce from 'licia/debounce'
import path from 'path'

const DEBOUNCE_MS = 1000
const MIN_REFRESH_INTERVAL_MS = 5000
const MAX_TRACKED_FILES_FOR_WATCH = 8000
const MAX_WATCH_PATHS = 5000

const WATCH_EVENTS = new Set(['add', 'addDir', 'change', 'unlink', 'unlinkDir'])

const GIT_NOISE = /[/\\]\.git[/\\]index\.lock$|[/\\]\.watchman-cookie-/

let watcher: FSWatcher | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let watchSession = 0
let lastRefreshAt = 0

function execGitLsFiles(repoPath: string): Promise<string[]> {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['ls-files', '-z'],
      {
        cwd: repoPath,
        encoding: 'buffer',
        maxBuffer: 50 * 1024 * 1024,
      },
      (err, stdout) => {
        if (err) {
          resolve([])
          return
        }
        resolve(stdout.toString('utf8').split('\0').filter(Boolean))
      }
    )
  })
}

function gitMetadataPaths(repoPath: string): string[] {
  const gitDir = path.join(repoPath, '.git')
  return [
    path.join(gitDir, 'HEAD'),
    path.join(gitDir, 'index'),
    path.join(gitDir, 'ORIG_HEAD'),
    path.join(gitDir, 'MERGE_HEAD'),
    path.join(gitDir, 'CHERRY_PICK_HEAD'),
    path.join(gitDir, 'REBASE_HEAD'),
    path.join(gitDir, 'refs', 'heads'),
  ]
}

function cleanupWatchers() {
  void watcher?.close()
  watcher = null

  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function stopWatch(session: number) {
  if (session !== watchSession) return
  watchSession++
  cleanupWatchers()
}

function startPolling(session: number, emit: () => void) {
  pollTimer = setInterval(() => {
    if (session !== watchSession) return
    emit()
  }, MIN_REFRESH_INTERVAL_MS)
}

function startChokidar(
  session: number,
  watchPaths: string[],
  emit: () => void
) {
  if (watchPaths.length === 0) return

  const w = watch(watchPaths, {
    ignoreInitial: true,
    persistent: true,
    ignorePermissionErrors: true,
    followSymlinks: false,
  })

  if (session !== watchSession) {
    void w.close()
    return
  }

  watcher = w

  w.on('all', (event, filePath) => {
    if (session !== watchSession) return
    if (!WATCH_EVENTS.has(event)) return
    if (GIT_NOISE.test(filePath)) return
    emit()
  })
}

export function watchWorkingTree(
  repoPath: string,
  onChange: () => void
): () => void {
  const session = ++watchSession
  cleanupWatchers()

  if (!repoPath) {
    return () => stopWatch(session)
  }

  const emit = debounce(() => {
    if (session !== watchSession) return

    const now = Date.now()
    if (now - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) return
    lastRefreshAt = now

    onChange()
  }, DEBOUNCE_MS)

  setImmediate(() => {
    void setup()
  })

  async function setup() {
    if (session !== watchSession) return

    const tracked = await execGitLsFiles(repoPath)
    if (session !== watchSession) return

    const metaPaths = gitMetadataPaths(repoPath)

    if (tracked.length > MAX_TRACKED_FILES_FOR_WATCH) {
      startChokidar(session, metaPaths, emit)
      startPolling(session, emit)
      return
    }

    const trackedPaths = tracked
      .slice(0, MAX_WATCH_PATHS)
      .map((file) => path.join(repoPath, file))

    startChokidar(session, [...metaPaths, ...trackedPaths], emit)
  }

  return () => stopWatch(session)
}
