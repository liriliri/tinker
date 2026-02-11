import { contextBridge } from 'electron'
import si from 'systeminformation'

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

const processKillerObj = {
  async getProcessList(): Promise<ProcessInfo[]> {
    try {
      const { list } = await si.processes()
      return list.map((proc) => ({
        pid: proc.pid,
        name: proc.name,
        cpu: proc.cpu,
        mem: proc.mem,
        memRss: proc.memRss || 0,
        user: proc.user,
        command: proc.command,
        path: proc.path,
        state: proc.state,
      }))
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
