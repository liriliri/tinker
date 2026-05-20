import isWindows from 'licia/isWindows'
import isMac from 'licia/isMac'
import trim from 'licia/trim'
import uuid from 'licia/uuid'
import { ChildProcess } from 'child_process'
import { searchFile as searchFileMac } from './mac'
import { searchFile as searchFileWin } from './win'

export interface SearchFileResult {
  path: string
  size: number
  dateModified: number
}

export interface SearchFileOptions {
  offset?: number
  maxResults?: number
  dirs?: string[]
  exts?: string[]
}

class SearchTask {
  private searchProcess: ChildProcess | null = null
  private promise: Promise<SearchFileResult[]>

  constructor(
    query: string,
    offset: number,
    maxResults: number,
    dirs?: string[],
    exts?: string[]
  ) {
    if (isMac) {
      const { process, promise } = searchFileMac(
        query,
        offset,
        maxResults,
        dirs,
        exts
      )
      this.searchProcess = process
      this.promise = promise
    } else if (isWindows) {
      this.promise = searchFileWin(query, offset, maxResults, dirs, exts).then(
        ({ process, promise }) => {
          this.searchProcess = process
          return promise
        }
      )
    } else {
      this.promise = Promise.resolve([])
    }
  }

  getPromise(): Promise<SearchFileResult[]> {
    return this.promise
  }

  kill(): void {
    if (this.searchProcess && !this.searchProcess.killed) {
      this.searchProcess.kill('SIGKILL')
    }
  }

  quit(): void {
    if (this.searchProcess && !this.searchProcess.killed) {
      this.searchProcess.kill('SIGTERM')
    }
  }
}

class SearchTaskManager {
  private tasks = new Map<string, SearchTask>()

  run(
    query: string,
    options: SearchFileOptions = {}
  ): {
    promise: Promise<SearchFileResult[]>
    taskId: string
  } {
    const { offset = 0, maxResults = 50 } = options
    const trimmed = trim(query)
    if (!trimmed) {
      return { promise: Promise.resolve([]), taskId: '' }
    }

    const taskId = uuid()
    const task = new SearchTask(
      trimmed,
      offset,
      maxResults,
      options.dirs,
      options.exts
    )
    this.tasks.set(taskId, task)

    const promise = task.getPromise().finally(() => {
      this.tasks.delete(taskId)
    })

    return { promise, taskId }
  }

  kill(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (task) {
      task.kill()
    }
  }

  quit(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (task) {
      task.quit()
    }
  }
}

const searchManager = new SearchTaskManager()

export function searchFile(
  query: string,
  options: SearchFileOptions = {}
): { promise: Promise<SearchFileResult[]>; taskId: string } {
  return searchManager.run(query, options)
}

export function killSearchFile(taskId: string): void {
  searchManager.kill(taskId)
}

export function quitSearchFile(taskId: string): void {
  searchManager.quit(taskId)
}
