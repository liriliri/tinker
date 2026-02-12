import { contextBridge } from 'electron'
import si from 'systeminformation'
import path from 'path'
import { promises as fs } from 'fs'

interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  mem: number
  memRss: number
  user: string
  command?: string
  path?: string
  state?: string
}

async function extractExecutablePath(proc: any): Promise<string | undefined> {
  let execPath = proc.path || ''

  if (!execPath && !proc.command) {
    return undefined
  }

  if (!execPath && proc.command) {
    const parts = proc.command.split(' ')
    execPath = parts[0]
  }

  if (execPath) {
    try {
      const stats = await fs.stat(execPath)
      if (stats.isDirectory() && proc.command) {
        const commandParts = proc.command.split(' ')
        const commandPath = commandParts[0]

        if (path.isAbsolute(commandPath)) {
          return commandPath
        } else {
          const fullPath = path.join(execPath, commandPath)
          try {
            await fs.access(fullPath)
            return fullPath
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return execPath || undefined
}

const processKillerObj = {
  async getProcessList(): Promise<ProcessInfo[]> {
    try {
      const { list } = await si.processes()
      const processesWithPaths = await Promise.all(
        list.map(async (proc) => ({
          pid: proc.pid,
          name: proc.name,
          cpu: proc.cpu,
          mem: proc.mem,
          memRss: proc.memRss || 0,
          user: proc.user,
          command: proc.command,
          path: await extractExecutablePath(proc),
          state: proc.state,
        }))
      )
      return processesWithPaths
    } catch (error) {
      console.error('Failed to get process list:', error)
      throw error
    }
  },

  async killProcess(pid: number): Promise<void> {
    try {
      process.kill(pid, 'SIGKILL')
    } catch (error) {
      console.error(`Failed to kill process ${pid}:`, error)
      throw error
    }
  },

  async getNetworkConnections(): Promise<any[]> {
    try {
      return await si.networkConnections()
    } catch (error) {
      console.error('Failed to get network connections:', error)
      return []
    }
  },
}

contextBridge.exposeInMainWorld('processKiller', processKillerObj)

declare global {
  const processKiller: typeof processKillerObj
}
