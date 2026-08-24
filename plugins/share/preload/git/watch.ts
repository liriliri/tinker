import { watch, type FSWatcher } from 'chokidar'
import debounce from 'licia/debounce'
import path from 'path'

const DEBOUNCE_MS = 1000
const MIN_REFRESH_INTERVAL_MS = 5000

const WATCH_EVENTS = new Set(['add', 'addDir', 'change', 'unlink', 'unlinkDir'])

const GIT_NOISE = /[/\\]\.git[/\\]index\.lock$|[/\\]\.watchman-cookie-/

let watcher: FSWatcher | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let watchSession = 0
let lastRefreshAt = 0

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

  // An unhandled error event is rethrown per failing path, which floods
  // the renderer when file descriptors run out (EMFILE).
  w.on('error', () => {
    if (session !== watchSession || watcher !== w) return

    void w.close()
    watcher = null
    if (!pollTimer) {
      startPolling(session, emit)
    }
  })

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
    if (session !== watchSession) return

    // Only watch .git metadata (HEAD, index, refs, …). Tracked working-tree
    // files are covered by polling so we do not register thousands of watches
    // per project window.
    startChokidar(session, gitMetadataPaths(repoPath), emit)
    startPolling(session, emit)
  })

  return () => stopWatch(session)
}
